// Плагин для выравнивания вариантов компонента
figma.showUI(__html__, { width: 360, height: 620 });

// Функция для получения всех доступных свойств вариантов
function getVariantProperties(componentSet) {
  const variants = componentSet.children.filter(child => child.type === 'COMPONENT');
  const allProperties = new Set();
  
  variants.forEach(variant => {
    if (variant.variantProperties) {
      Object.keys(variant.variantProperties).forEach(prop => {
        allProperties.add(prop);
      });
    }
  });
  
  return Array.from(allProperties);
}

// Функция для получения ComponentSet из выделения
function getComponentSetFromSelection() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    return null;
  }

  for (const node of selection) {
    if (node.type === 'COMPONENT_SET') {
      return node;
    } else if (node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET') {
      return node.parent;
    }
  }
  
  return null;
}





// Функция для отправки информации о текущем выделении в UI
function updateSelectionInfo() {
  const componentSet = getComponentSetFromSelection();
  
  if (componentSet) {
    const properties = getVariantProperties(componentSet);
    const variantCount = componentSet.children.filter(child => child.type === 'COMPONENT').length;
    
    figma.ui.postMessage({ 
      type: 'selection-updated', 
      data: {
        componentSetName: componentSet.name,
        properties: properties,
        variantCount: variantCount,
        hasValidSelection: true
      }
    });
  } else {
    figma.ui.postMessage({ 
      type: 'selection-updated', 
      data: {
        componentSetName: null,
        properties: [],
        variantCount: 0,
        hasValidSelection: false
      }
    });
  }
}

// Функция для создания ключа группы на основе выбранных свойств
function createGroupKey(variant, groupProperties) {
  if (!variant.variantProperties || groupProperties.length === 0) {
    return 'default';
  }
  
  return groupProperties
    .map(prop => `${prop}:${variant.variantProperties[prop] || 'undefined'}`)
    .join('|');
}

// Функция для создания ключа сортировки внутри группы
function createSortingKey(variant, excludeProperties) {
  if (!variant.variantProperties) return '';
  
  const sortingProperties = Object.keys(variant.variantProperties)
    .filter(prop => !excludeProperties.includes(prop))
    .sort();
    
  return sortingProperties
    .map(prop => `${prop}:${variant.variantProperties[prop]}`)
    .join('|');
}

// Функция для создания папки аннотаций
function createAnnotationsFolder(componentSet) {
  const parentNode = componentSet.parent;
  if (!parentNode) return null;
  
  const annotationsFolderName = `${componentSet.name} annotations`;
  
  // Создаем контейнер для сбора аннотаций по уровням
  const annotationsContainer = {
    name: annotationsFolderName,
    parent: parentNode,
    level1Annotations: [], // колонки
    level2Annotations: [], // группы
    lines: [], // линии
    
    addLevel1Annotation: function(annotation) {
      this.level1Annotations.push(annotation);
      this.parent.appendChild(annotation);
    },
    
    addLevel2Annotation: function(annotation) {
      this.level2Annotations.push(annotation);
      this.parent.appendChild(annotation);
    },
    
    addLine: function(line) {
      this.lines.push(line);
      this.parent.appendChild(line);
    },
    
    // Метод для создания финальной структуры папок из всех аннотаций
    createFinalStructure: function(columnDirection, annotationSpacing = 24) {
      if (this.level1Annotations.length === 0 && this.level2Annotations.length === 0) {
        return null;
      }
      
      const allElements = [];
      
      // Создаем папки для каждого уровня только если есть аннотации этого уровня
      if (this.level2Annotations.length > 0) {
        const level2Folder = figma.group(this.level2Annotations.concat(this.lines), this.parent);
        level2Folder.name = 'Level 2';
        allElements.push(level2Folder);
      }
      
      if (this.level1Annotations.length > 0) {
        const level1Folder = figma.group(this.level1Annotations, this.parent);
        level1Folder.name = 'Level 1';
        allElements.push(level1Folder);
      }
      
      // Создаем общий Frame с Auto Layout
      if (allElements.length > 0) {
        const mainFrame = figma.createFrame();
        mainFrame.name = this.name;
        mainFrame.fills = []; // Убираем фон
        mainFrame.strokes = []; // Убираем границы
        mainFrame.clipsContent = false;
        
        // Настраиваем Auto Layout
        mainFrame.layoutMode = columnDirection === 'horizontal' ? 'VERTICAL' : 'HORIZONTAL';
        mainFrame.itemSpacing = annotationSpacing;
        mainFrame.primaryAxisAlignItems = 'MIN';
        mainFrame.counterAxisAlignItems = 'MIN';
        mainFrame.primaryAxisSizingMode = 'AUTO';
        mainFrame.counterAxisSizingMode = 'AUTO';
        
        // Добавляем Frame в родительский узел
        this.parent.appendChild(mainFrame);
        
        // Перемещаем все элементы в Frame
        allElements.forEach(element => {
          mainFrame.appendChild(element);
        });
        
        return mainFrame;
      }
      
      return null;
    }
  };
  
  return annotationsContainer;
}



// Функция для создания линии аннотации
function createAnnotationLine(startX, startY, endX, endY, annotationsFolder) {
  const line = figma.createVector();
  
  // Определяем направление линии
  const isHorizontal = Math.abs(endX - startX) > Math.abs(endY - startY);
  const bendLength = 8; // Длина загиба в пикселях
  
  let pathData;
  
  if (isHorizontal) {
    // Горизонтальная линия с загибами вниз в начале и конце (оба в сторону ComponentSet)
    pathData = `M ${startX} ${startY + bendLength} L ${startX} ${startY} L ${endX} ${startY} L ${endX} ${startY + bendLength}`;
  } else {
    // Вертикальная линия с загибами вправо в начале и конце (оба в сторону ComponentSet)  
    pathData = `M ${startX + bendLength} ${startY} L ${startX} ${startY} L ${startX} ${endY} L ${startX + bendLength} ${endY}`;
  }
  
  // Создаем векторные пути
  line.vectorPaths = [{
    windingRule: "NONZERO",
    data: pathData
  }];
  
  // Настраиваем внешний вид линии
  line.strokes = [{ 
    type: 'SOLID', 
    color: { r: 0.482, g: 0.161, b: 0.898 }, // #7B29E5
    opacity: 0.3 
  }];
  line.strokeWeight = 2; // Толщина линии в пикселях
  line.strokeCap = "ROUND"; // Закругленные концы
  line.strokeJoin = "ROUND"; // Закругленные соединения
  line.cornerRadius = 6; // Скругление углов на загибах
  line.fills = []; // Убираем заливку
  
  // Добавляем линию в папку аннотаций
  if (annotationsFolder) {
    annotationsFolder.addLine(line);
  }
  
  return line;
}

// Функция для создания аннотации группы
async function createGroupAnnotation(text, x, y) {
  // Создаем рамку для фона с AutoLayout
  const backgroundFrame = figma.createFrame();
  backgroundFrame.name = `Group Label: ${text}`;
  backgroundFrame.layoutMode = 'HORIZONTAL';
  backgroundFrame.primaryAxisAlignItems = 'CENTER';
  backgroundFrame.counterAxisAlignItems = 'CENTER';
  backgroundFrame.primaryAxisSizingMode = 'AUTO'; // hug content по ширине
  backgroundFrame.counterAxisSizingMode = 'AUTO'; // hug content по высоте
  backgroundFrame.paddingLeft = 8;
  backgroundFrame.paddingRight = 8;
  backgroundFrame.paddingTop = 3;
  backgroundFrame.paddingBottom = 4;
  backgroundFrame.cornerRadius = 10;
  backgroundFrame.fills = [{ type: 'SOLID', color: { r: 0.482, g: 0.161, b: 0.898 } }]; // #7B29E5
  backgroundFrame.strokes = [];
  backgroundFrame.clipsContent = false;
  
  // Создаем текст
  const textNode = figma.createText();
  
  try {
    // Пытаемся загрузить SB Sans Text
    await figma.loadFontAsync({ family: "SB Sans Text", style: "Medium" });
    textNode.fontName = { family: "SB Sans Text", style: "Medium" };
  } catch (error) {
    try {
      // Если SB Sans Text недоступен, используем Inter
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      textNode.fontName = { family: "Inter", style: "Medium" };
    } catch (error) {
      // Последняя попытка с Roboto
      await figma.loadFontAsync({ family: "Roboto", style: "Medium" });
      textNode.fontName = { family: "Roboto", style: "Medium" };
    }
  }
  
  textNode.fontSize = 14;
  textNode.lineHeight = { value: 18, unit: "PIXELS" };
  textNode.letterSpacing = { value: -0.28, unit: "PIXELS" };
  textNode.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; // #FFF
  textNode.textAlignHorizontal = 'CENTER';
  textNode.characters = text;
  
  // Устанавливаем auto width с максимальной шириной 100px
  textNode.textAutoResize = 'WIDTH_AND_HEIGHT';
  
  // Если ширина превышает 100px, ограничиваем ее с переносом строк
  if (textNode.width > 100) {
    textNode.textAutoResize = 'HEIGHT';
    textNode.resize(100, textNode.height);
  }
  
  // Добавляем текст в рамку - AutoLayout автоматически центрирует
  backgroundFrame.appendChild(textNode);
  
  // Позиционируем аннотацию
  backgroundFrame.x = x;
  backgroundFrame.y = y;
  
  return backgroundFrame;
}

// Функция для многоуровневой группировки вариантов
function createMultiLevelGroups(variants, groupProperties, columnProperty) {
  // Сначала группируем по основным свойствам
  const mainGroups = {};
  
  variants.forEach(variant => {
    const groupKey = createGroupKey(variant, groupProperties);
    if (!mainGroups[groupKey]) {
      mainGroups[groupKey] = [];
    }
    mainGroups[groupKey].push(variant);
  });
  
  // Затем группируем каждую основную группу по свойству колонок
  const result = {};
  
  Object.keys(mainGroups).forEach(groupKey => {
    const groupVariants = mainGroups[groupKey];
    
    if (columnProperty) {
      // Группируем по свойству колонок
      const columns = {};
      groupVariants.forEach(variant => {
        const columnValue = (variant.variantProperties && variant.variantProperties[columnProperty]) || 'Other';
        if (!columns[columnValue]) {
          columns[columnValue] = [];
        }
        columns[columnValue].push(variant);
      });
      
      // Сортируем варианты внутри каждой колонки
      const excludeProps = [...groupProperties, columnProperty];
      Object.keys(columns).forEach(columnKey => {
        columns[columnKey].sort((a, b) => {
          const keyA = createSortingKey(a, excludeProps);
          const keyB = createSortingKey(b, excludeProps);
          return keyA.localeCompare(keyB);
        });
      });
      
      result[groupKey] = columns;
    } else {
      // Если нет свойства для колонок, создаем одну колонку
      const excludeProps = groupProperties;
      groupVariants.sort((a, b) => {
        const keyA = createSortingKey(a, excludeProps);
        const keyB = createSortingKey(b, excludeProps);
        return keyA.localeCompare(keyB);
      });
      
      result[groupKey] = { 'default': groupVariants };
    }
  });
  
  return result;
}

// Функция для выравнивания вариантов компонента с многоуровневой группировкой
function alignComponentVariants(
  componentSet, 
  padding = 40, 
  spacing = 20, 
  columnSpacing = 40, 
  groupSpacing = 80, 
  groupsPerRow = 3,
  columnDirection = 'horizontal',
  groupProperties = [], 
  columnProperty = null,
  showAnnotations = false,
  annotationSpacing = 24
) {
  if (!componentSet || componentSet.type !== 'COMPONENT_SET') {
    figma.notify('Выберите набор компонентов (Component Set)');
    return;
  }

  try {
    const variants = componentSet.children.filter(child => child.type === 'COMPONENT');
    
    if (variants.length === 0) {
      figma.notify('В наборе компонентов нет вариантов');
      return;
    }

    // Отключаем auto-layout
    componentSet.layoutMode = 'NONE';
    
    // Удаляем существующую папку аннотаций (всегда, чтобы можно было убрать их при выключении опции)
    const parentNode = componentSet.parent;
    const annotationsFolderName = `${componentSet.name} annotations`;
    if (parentNode) {
      const existingAnnotationsFolder = parentNode.children.find(child => 
        child.name === annotationsFolderName);
      if (existingAnnotationsFolder) {
        existingAnnotationsFolder.remove();
      }
    }
    
    if (groupProperties.length > 0 || columnProperty) {
      // Многоуровневая группировка
      const groups = createMultiLevelGroups(variants, groupProperties, columnProperty);
      setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing);
      
      const groupCount = Object.keys(groups).length;
      const totalColumns = Object.values(groups).reduce((max, group) => 
        Math.max(max, Object.keys(group).length), 0);
      const rows = Math.ceil(groupCount / groupsPerRow);
      const directionText = columnDirection === 'vertical' ? 'вертикально' : 'горизонтально';
        
      figma.notify(`Создано ${groupCount} групп (${rows} строк по ${groupsPerRow} макс.) с ${totalColumns} максимум колонок в группе, направление: ${directionText}`);
    } else {
     // Простая сетка без группировки
     setupSimpleGridLayout(componentSet, variants, padding, spacing, showAnnotations, columnDirection, annotationSpacing);
     figma.notify(`Варианты выровнены в простую сетку`);
   }

  } catch (error) {
    figma.notify('Ошибка при выравнивании: ' + error.message);
    console.error(error);
  }
}

// Функция для создания многоуровневого Grid layout
function setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing = 24) {
  const parentNode = componentSet.parent;
  const componentSetX = componentSet.x;
  const componentSetY = componentSet.y;
  
  // Создаем папку для аннотаций если нужно
  let annotationsFolder = null;
  if (showAnnotations && parentNode) {
    annotationsFolder = createAnnotationsFolder(componentSet);
  }
  
  // Создаем набор для отслеживания уже созданных аннотаций
  const createdAnnotations = new Set();
  
  // Находим максимальные размеры среди всех компонентов
  let maxWidth = 0;
  let maxHeight = 0;
  
  Object.values(groups).forEach(group => {
    Object.values(group).forEach(columnVariants => {
      columnVariants.forEach(variant => {
        if (variant.width > maxWidth) maxWidth = variant.width;
        if (variant.height > maxHeight) maxHeight = variant.height;
      });
    });
  });
  
  const groupKeys = Object.keys(groups).sort();
  
  // Рассчитываем размеры строк и максимальную ширину строки
  const rowHeights = [];
  const rowWidths = [];
  let maxRowWidth = 0;
  
  // Группируем по строкам и рассчитываем размеры
  for (let rowIndex = 0; rowIndex < Math.ceil(groupKeys.length / groupsPerRow); rowIndex++) {
    const rowGroupKeys = groupKeys.slice(rowIndex * groupsPerRow, (rowIndex + 1) * groupsPerRow);
    let rowHeight = 0;
    let rowWidth = padding;
    
    rowGroupKeys.forEach((groupKey, groupInRowIndex) => {
      const group = groups[groupKey];
      const columnKeys = Object.keys(group).sort();
      
      let groupWidth, groupHeight;
      
      if (columnDirection === 'horizontal') {
        // Горизонтальное расположение колонок
        const maxItemsInGroup = Math.max(...columnKeys.map(key => group[key].length));
        groupHeight = maxItemsInGroup * maxHeight + (maxItemsInGroup - 1) * spacing;
        groupWidth = columnKeys.length * maxWidth + (columnKeys.length - 1) * columnSpacing;
      } else {
        // Вертикальное расположение колонок
        const totalItemsInGroup = columnKeys.reduce((sum, key) => sum + group[key].length, 0);
        const totalSpacingBetweenColumns = (columnKeys.length - 1) * columnSpacing;
        const totalSpacingBetweenItems = totalItemsInGroup - columnKeys.length; // Пробелы между элементами в каждой колонке
        
        groupHeight = totalItemsInGroup * maxHeight + totalSpacingBetweenItems * spacing + totalSpacingBetweenColumns;
        groupWidth = maxWidth;
      }
      
      rowHeight = Math.max(rowHeight, groupHeight);
      rowWidth += groupWidth;
      
      // Добавляем отступ между группами (кроме последней в строке)
      if (groupInRowIndex < rowGroupKeys.length - 1) {
        rowWidth += groupSpacing;
      }
    });
    
    rowWidth += padding; // Добавляем padding справа
    rowHeights.push(rowHeight);
    rowWidths.push(rowWidth);
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
  }
  
  // Позиционируем компоненты
  let currentRowY = padding;
  const annotationOffset = 15; // Отступ для аннотаций
  
  for (let rowIndex = 0; rowIndex < Math.ceil(groupKeys.length / groupsPerRow); rowIndex++) {
    const rowGroupKeys = groupKeys.slice(rowIndex * groupsPerRow, (rowIndex + 1) * groupsPerRow);
    let currentGroupX = padding;
    
    rowGroupKeys.forEach((groupKey, groupInRowIndex) => {
      const group = groups[groupKey];
      const columnKeys = Object.keys(group).sort();
      let groupWidth;
      
      if (columnDirection === 'horizontal') {
        // Горизонтальное расположение колонок - аннотации сверху
        columnKeys.forEach((columnKey, columnIndex) => {
          const columnVariants = group[columnKey];
          const columnX = currentGroupX + columnIndex * (maxWidth + columnSpacing);
          
          // Создаем аннотацию для колонки сверху (если включены аннотации, есть название колонки и она еще не создана в этой позиции)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-pos-${columnX}`)) {
            // Рассчитываем позицию уровня 2 с правильными отступами 24px
            const variantAnnotationHeight = 25; // примерная высота рамки (hug content адаптируется)
            const columnAnnotationHeight = 25;
            const level3Y = componentSetY - annotationSpacing - variantAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации варианта
            const level2Y = level3Y - annotationSpacing - columnAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации колонки
            
            createGroupAnnotation(
              columnKey, 
              columnX, 
              level2Y // Позиционируем на среднем уровне (уровень 2)
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.addLevel1Annotation(annotation);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${columnX}`);
          }
          
          // Позиционируем варианты внутри колонки
          columnVariants.forEach((variant, itemIndex) => {
            variant.x = columnX;
            variant.y = currentRowY + itemIndex * (maxHeight + spacing);
          });
        });
        
        groupWidth = columnKeys.length * maxWidth + (columnKeys.length - 1) * columnSpacing;
        
        // Создаем аннотацию для группы сверху по центру (если включены аннотации, есть название группы и она еще не создана)
        if (showAnnotations && groupKey !== 'default' && annotationsFolder && !createdAnnotations.has(`group-${groupKey}`)) {
          const groupCenterX = currentGroupX + groupWidth / 2;
          // Сохраняем значения в локальных переменных для использования в .then()
          const groupStartX = currentGroupX;
          const currentGroupWidth = groupWidth;
          
          // Рассчитываем позицию с правильными отступами 24px между уровнями
          const variantAnnotationHeight = 25; // примерная высота для одной строки (hug content адаптируется)
          const columnAnnotationHeight = 25;
          
          const level3Y = componentSetY - annotationSpacing - variantAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации варианта
          const level2Y = level3Y - annotationSpacing - columnAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации колонки  
          const level1Y = level2Y - annotationSpacing - columnAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации группы
          
          const annotationY = level1Y;
          
          // Создаем аннотацию по центру группы
          createGroupAnnotation(
            groupKey,
            groupCenterX,
            annotationY
          ).then(annotation => {
            annotation.name = `annotation-group-${groupKey}`;
            // Центрируем аннотацию относительно своей ширины
            annotation.x = groupCenterX - annotation.width / 2;
            annotationsFolder.addLevel2Annotation(annotation);
            
            // Создаем горизонтальную линию под аннотацией от начала до конца группы
            // Центрируем линию по вертикали относительно аннотации
            const lineCenterY = annotationY + annotation.height / 2;
            createAnnotationLine(
              groupStartX,
              lineCenterY,
              groupStartX + currentGroupWidth,
              lineCenterY,
              annotationsFolder
            );
          });
          
          // Отмечаем, что аннотация для этой группы уже создана
          createdAnnotations.add(`group-${groupKey}`);
        }
      } else {
        // Вертикальное расположение колонок - аннотации слева
        let currentColumnY = currentRowY;
        const groupStartY = currentColumnY;
        
        // Сначала рассчитываем общую высоту группы
        let totalGroupHeight = 0;
        columnKeys.forEach((columnKey, columnIndex) => {
          const columnVariants = group[columnKey];
          const columnHeight = columnVariants.length * maxHeight + (columnVariants.length - 1) * spacing;
          totalGroupHeight += columnHeight;
          
          // Добавляем отступ между колонками (кроме последней)
          if (columnIndex < columnKeys.length - 1) {
            totalGroupHeight += columnSpacing;
          }
        });
        
        // Создаем аннотацию для группы слева по центру (если включены аннотации, есть название группы и она еще не создана)
        if (showAnnotations && groupKey !== 'default' && annotationsFolder && !createdAnnotations.has(`group-${groupKey}`)) {
          const groupCenterY = groupStartY + totalGroupHeight / 2;
          // Сохраняем значения в локальных переменных для использования в .then()
          const currentGroupStartY = groupStartY;
          const currentTotalGroupHeight = totalGroupHeight;
          
          // Рассчитываем позицию с правильными отступами 24px между уровнями
          const variantAnnotationWidth = 116; // примерная ширина (hug content адаптируется)
          const columnAnnotationWidth = 116;
          
          const level3X = componentSetX - annotationSpacing - variantAnnotationWidth; // позиция ЛЕВОЙ границы аннотации варианта
          const level2X = level3X - annotationSpacing - columnAnnotationWidth; // позиция ЛЕВОЙ границы аннотации колонки
          const level1X = level2X - annotationSpacing - columnAnnotationWidth; // позиция ЛЕВОЙ границы аннотации группы
          
          const annotationX = level1X;
          
          // Создаем аннотацию по центру группы
          createGroupAnnotation(
            groupKey,
            annotationX,
            groupCenterY
          ).then(annotation => {
            annotation.name = `annotation-group-${groupKey}`;
            // Центрируем аннотацию относительно своей высоты
            annotation.y = groupCenterY - annotation.height / 2;
            annotationsFolder.addLevel2Annotation(annotation);
            
            // Создаем вертикальную линию справа от аннотации от начала до конца группы
            // Центрируем линию по горизонтали относительно аннотации
            const lineCenterX = annotationX + annotation.width / 2;
            createAnnotationLine(
              lineCenterX,
              currentGroupStartY,
              lineCenterX,
              currentGroupStartY + currentTotalGroupHeight,
              annotationsFolder
            );
          });
          
          // Отмечаем, что аннотация для этой группы уже создана
          createdAnnotations.add(`group-${groupKey}`);
        }
        
        columnKeys.forEach((columnKey, columnIndex) => {
          const columnVariants = group[columnKey];
          
          // Создаем аннотацию для колонки слева (если включены аннотации, есть название колонки и она еще не создана в этой позиции)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-pos-${currentColumnY}`)) {
            // Рассчитываем позицию уровня 2 с правильными отступами 24px
            const variantAnnotationWidth = 116; // примерная ширина рамки (hug content адаптируется)
            const columnAnnotationWidth = 116;
            const level3X = componentSetX - annotationSpacing - variantAnnotationWidth; // позиция ЛЕВОЙ границы аннотации варианта
            const level2X = level3X - annotationSpacing - columnAnnotationWidth; // позиция ЛЕВОЙ границы аннотации колонки
            
            createGroupAnnotation(
              columnKey,
              level2X, // Позиционируем на среднем уровне (уровень 2)
              currentColumnY + 5
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.addLevel1Annotation(annotation);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${currentColumnY}`);
          }
          
          // Позиционируем варианты внутри колонки
          columnVariants.forEach((variant, itemIndex) => {
            variant.x = currentGroupX;
            variant.y = currentColumnY + itemIndex * (maxHeight + spacing);
          });
          
          // Переходим к следующей колонке по вертикали
          currentColumnY += columnVariants.length * maxHeight + (columnVariants.length - 1) * spacing;
          
          // Добавляем отступ между колонками (кроме последней)
          if (columnIndex < columnKeys.length - 1) {
            currentColumnY += columnSpacing;
          }
        });
        
        groupWidth = maxWidth;
      }
      
      // Обновляем позицию для следующей группы в строке
      currentGroupX += groupWidth;
      
      // Добавляем отступ между группами (кроме последней в строке)
      if (groupInRowIndex < rowGroupKeys.length - 1) {
        currentGroupX += groupSpacing;
      }
    });
    
    // Переходим к следующей строке
    currentRowY += rowHeights[rowIndex] + (rowIndex < rowHeights.length - 1 ? groupSpacing : 0);
  }
  
  // Рассчитываем общие размеры ComponentSet
  const totalWidth = maxRowWidth;
  const totalHeight = currentRowY + padding;
  
  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную структуру из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalStructure) {
    setTimeout(() => {
      annotationsFolder.createFinalStructure(columnDirection, annotationSpacing);
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
  
  console.log(`Groups positioned: ${groupKeys.length} groups in ${Math.ceil(groupKeys.length / groupsPerRow)} rows, total size: ${totalWidth}x${totalHeight}`);
}

// Функция для создания простого Grid layout (резервная)
function setupSimpleGridLayout(componentSet, variants, padding, spacing, showAnnotations, columnDirection = 'horizontal', annotationSpacing = 24) {
  const parentNode = componentSet.parent;
  const componentSetX = componentSet.x;
  const componentSetY = componentSet.y;
  
  // Создаем папку для аннотаций если нужно
  let annotationsFolder = null;
  if (showAnnotations && parentNode) {
    annotationsFolder = createAnnotationsFolder(componentSet);
  }
  
  // Простая сетка в одну колонку
  let maxWidth = 0;
  let maxHeight = 0;
  
  variants.forEach(variant => {
    if (variant.width > maxWidth) maxWidth = variant.width;
    if (variant.height > maxHeight) maxHeight = variant.height;
  });
  
  variants.forEach((variant, index) => {
    variant.x = padding;
    variant.y = padding + index * (maxHeight + spacing);
    
    // Создаем аннотацию для варианта в зависимости от направления (если включены аннотации)
    if (showAnnotations && annotationsFolder) {
      const variantName = variant.name || `Variant ${index + 1}`;
      

    }
  });
  
  const totalWidth = maxWidth + 2 * padding; // Аннотации теперь располагаются за пределами ComponentSet
  const totalHeight = variants.length * maxHeight + (variants.length - 1) * spacing + 2 * padding;
  
  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную структуру из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalStructure) {
    setTimeout(() => {
      annotationsFolder.createFinalStructure(columnDirection, annotationSpacing);
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
}

// Отслеживание изменения выделения
figma.on('selectionchange', () => {
  updateSelectionInfo();
});

// Обработчик сообщений от UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'get-properties') {
    updateSelectionInfo();
  }
  
  if (msg.type === 'align-variants') {
    const componentSet = getComponentSetFromSelection();
    
    if (!componentSet) {
      figma.notify('Выберите набор компонентов');
      return;
    }

    const settings = {
      padding: msg.padding || 40,
      spacing: msg.spacing || 20,
      columnSpacing: msg.columnSpacing || 40,
      groupSpacing: msg.groupSpacing || 80,
      groupsPerRow: msg.groupsPerRow || 3,
      columnDirection: msg.columnDirection || 'horizontal',
      groupProperties: msg.groupProperties || [],
      columnProperty: msg.columnProperty || null,
      showAnnotations: msg.showAnnotations || false,
      annotationSpacing: msg.annotationSpacing || 24
    };

    alignComponentVariants(
      componentSet, 
      settings.padding, 
      settings.spacing, 
      settings.columnSpacing, 
      settings.groupSpacing, 
      settings.groupsPerRow,
      settings.columnDirection,
      settings.groupProperties, 
      settings.columnProperty,
      settings.showAnnotations,
      settings.annotationSpacing
    );
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Инициализация - отправляем информацию о текущем выделении
updateSelectionInfo();
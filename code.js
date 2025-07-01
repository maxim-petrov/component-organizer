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
  const annotationsFolder = figma.createFrame();
  annotationsFolder.name = annotationsFolderName;
  annotationsFolder.layoutMode = 'NONE';
  annotationsFolder.fills = []; // Прозрачный фон
  annotationsFolder.strokes = []; // Без обводки
  annotationsFolder.clipsContent = false; // Не обрезать содержимое
  
  // Позиционируем папку в том же месте что и ComponentSet
  annotationsFolder.x = componentSet.x;
  annotationsFolder.y = componentSet.y;
  
  // Даем папке большой размер чтобы вместить все аннотации
  const extraSpace = 200; // Дополнительное место для аннотаций
  annotationsFolder.resize(
    componentSet.width + extraSpace, 
    componentSet.height + extraSpace
  );
  
  parentNode.appendChild(annotationsFolder);
  return annotationsFolder;
}

// Функция для создания текстовой аннотации
function createAnnotation(text, x, y, fontSize = 10, color = {r: 0.4, g: 0.4, b: 0.4}) {
  const textNode = figma.createText();
  
  // Загружаем шрифт (используем стандартный шрифт Figma)
  figma.loadFontAsync({ family: "Inter", style: "Medium" }).then(() => {
    textNode.fontName = { family: "Inter", style: "Medium" };
    textNode.fontSize = fontSize;
    textNode.fills = [{ type: 'SOLID', color: color }];
    textNode.characters = text;
    
    // Позиционируем аннотацию
    textNode.x = x;
    textNode.y = y;
  }).catch(() => {
    // Если Inter недоступен, используем системный шрифт
    figma.loadFontAsync({ family: "Roboto", style: "Medium" }).then(() => {
      textNode.fontName = { family: "Roboto", style: "Medium" };
      textNode.fontSize = fontSize;
      textNode.fills = [{ type: 'SOLID', color: color }];
      textNode.characters = text;
      
      textNode.x = x;
      textNode.y = y;
    }).catch(() => {
      // Последняя попытка с базовым шрифтом
      textNode.fontSize = fontSize;
      textNode.fills = [{ type: 'SOLID', color: color }];
      textNode.characters = text;
      
      textNode.x = x;
      textNode.y = y;
    });
  });
  
  return textNode;
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
  showAnnotations = false
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
      setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations);
      
      const groupCount = Object.keys(groups).length;
      const totalColumns = Object.values(groups).reduce((max, group) => 
        Math.max(max, Object.keys(group).length), 0);
      const rows = Math.ceil(groupCount / groupsPerRow);
      const directionText = columnDirection === 'vertical' ? 'вертикально' : 'горизонтально';
        
      figma.notify(`Создано ${groupCount} групп (${rows} строк по ${groupsPerRow} макс.) с ${totalColumns} максимум колонок в группе, направление: ${directionText}`);
    } else {
     // Простая сетка без группировки
     setupSimpleGridLayout(componentSet, variants, padding, spacing, showAnnotations);
     figma.notify(`Варианты выровнены в простую сетку`);
   }

  } catch (error) {
    figma.notify('Ошибка при выравнивании: ' + error.message);
    console.error(error);
  }
}

// Функция для создания многоуровневого Grid layout
function setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations) {
  const parentNode = componentSet.parent;
  const componentSetX = componentSet.x;
  const componentSetY = componentSet.y;
  
  // Создаем папку для аннотаций если нужно
  let annotationsFolder = null;
  if (showAnnotations && parentNode) {
    annotationsFolder = createAnnotationsFolder(componentSet);
  }
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
        // Горизонтальное расположение колонок
        columnKeys.forEach((columnKey, columnIndex) => {
          const columnVariants = group[columnKey];
          const columnX = currentGroupX + columnIndex * (maxWidth + columnSpacing);
          
          // Создаем аннотацию для колонки (если включены аннотации и есть название колонки)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder) {
            const columnAnnotation = createAnnotation(
              columnKey, 
              columnX, 
              currentRowY - annotationOffset,
              9,
              {r: 0.2, g: 0.5, b: 0.8}
            );
            columnAnnotation.name = `annotation-column-${columnKey}`;
            annotationsFolder.appendChild(columnAnnotation);
          }
          
          // Позиционируем варианты внутри колонки
          columnVariants.forEach((variant, itemIndex) => {
            variant.x = columnX;
            variant.y = currentRowY + itemIndex * (maxHeight + spacing);
            
            // Создаем аннотацию для варианта (если включены аннотации)
            if (showAnnotations && annotationsFolder) {
              const variantName = variant.name || `Variant ${itemIndex + 1}`;
              const variantAnnotation = createAnnotation(
                variantName,
                columnX + maxWidth + 5,
                variant.y + maxHeight / 2 - 5,
                8,
                {r: 0.6, g: 0.6, b: 0.6}
              );
              variantAnnotation.name = `annotation-variant-${variant.id}`;
              annotationsFolder.appendChild(variantAnnotation);
            }
          });
        });
        
        groupWidth = columnKeys.length * maxWidth + (columnKeys.length - 1) * columnSpacing;
        
        // Создаем аннотацию для группы (если включены аннотации и есть название группы)
        if (showAnnotations && groupKey !== 'default' && annotationsFolder) {
          const groupAnnotation = createAnnotation(
            groupKey,
            currentGroupX,
            currentRowY - annotationOffset - 15,
            10,
            {r: 0.8, g: 0.2, b: 0.2}
          );
          groupAnnotation.name = `annotation-group-${groupKey}`;
          annotationsFolder.appendChild(groupAnnotation);
        }
      } else {
        // Вертикальное расположение колонок
        let currentColumnY = currentRowY;
        
        // Создаем аннотацию для группы (если включены аннотации и есть название группы)
        if (showAnnotations && groupKey !== 'default' && annotationsFolder) {
          const groupAnnotation = createAnnotation(
            groupKey,
            currentGroupX - 10,
            currentColumnY - annotationOffset - 15,
            10,
            {r: 0.8, g: 0.2, b: 0.2}
          );
          groupAnnotation.name = `annotation-group-${groupKey}`;
          annotationsFolder.appendChild(groupAnnotation);
        }
        
        columnKeys.forEach((columnKey, columnIndex) => {
          const columnVariants = group[columnKey];
          
          // Создаем аннотацию для колонки (если включены аннотации и есть название колонки)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder) {
            const columnAnnotation = createAnnotation(
              columnKey,
              currentGroupX - 10,
              currentColumnY - annotationOffset,
              9,
              {r: 0.2, g: 0.5, b: 0.8}
            );
            columnAnnotation.name = `annotation-column-${columnKey}`;
            annotationsFolder.appendChild(columnAnnotation);
          }
          
          // Позиционируем варианты внутри колонки
          columnVariants.forEach((variant, itemIndex) => {
            variant.x = currentGroupX;
            variant.y = currentColumnY + itemIndex * (maxHeight + spacing);
            
            // Создаем аннотацию для варианта (если включены аннотации)
            if (showAnnotations && annotationsFolder) {
              const variantName = variant.name || `Variant ${itemIndex + 1}`;
              const variantAnnotation = createAnnotation(
                variantName,
                currentGroupX + maxWidth + 5,
                variant.y + maxHeight / 2 - 5,
                8,
                {r: 0.6, g: 0.6, b: 0.6}
              );
              variantAnnotation.name = `annotation-variant-${variant.id}`;
              annotationsFolder.appendChild(variantAnnotation);
            }
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
  
  console.log(`Groups positioned: ${groupKeys.length} groups in ${Math.ceil(groupKeys.length / groupsPerRow)} rows, total size: ${totalWidth}x${totalHeight}`);
}

// Функция для создания простого Grid layout (резервная)
function setupSimpleGridLayout(componentSet, variants, padding, spacing, showAnnotations) {
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
    
    // Создаем аннотацию для варианта (если включены аннотации)
    if (showAnnotations && annotationsFolder) {
      const variantName = variant.name || `Variant ${index + 1}`;
      const variantAnnotation = createAnnotation(
        variantName,
        padding + maxWidth + 5,
        variant.y + maxHeight / 2 - 5,
        8,
        {r: 0.6, g: 0.6, b: 0.6}
      );
      variantAnnotation.name = `annotation-variant-${variant.id}`;
      annotationsFolder.appendChild(variantAnnotation);
    }
  });
  
  const totalWidth = maxWidth + 2 * padding + (showAnnotations ? 150 : 0); // Дополнительное место для аннотаций
  const totalHeight = variants.length * maxHeight + (variants.length - 1) * spacing + 2 * padding;
  
  componentSet.resize(totalWidth, totalHeight);
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

    const padding = msg.padding || 40;
    const spacing = msg.spacing || 20;
    const columnSpacing = msg.columnSpacing || 40;
    const groupSpacing = msg.groupSpacing || 80;
    const groupsPerRow = msg.groupsPerRow || 3;
    const columnDirection = msg.columnDirection || 'horizontal';
    const groupProperties = msg.groupProperties || [];
    const columnProperty = msg.columnProperty || null;
    const showAnnotations = msg.showAnnotations || false;

    alignComponentVariants(
      componentSet, 
      padding, 
      spacing, 
      columnSpacing, 
      groupSpacing, 
      groupsPerRow,
      columnDirection,
      groupProperties, 
      columnProperty,
      showAnnotations
    );
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Инициализация - отправляем информацию о текущем выделении
updateSelectionInfo();
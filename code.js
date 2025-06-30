// Плагин для выравнивания вариантов компонента
figma.showUI(__html__, { width: 360, height: 450 });

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

// Функция для создания ключа сортировки на основе всех свойств кроме группирующего
function createSortingKey(variant, excludeProperty) {
  if (!variant.variantProperties) return '';
  
  const sortingProperties = Object.keys(variant.variantProperties)
    .filter(prop => prop !== excludeProperty)
    .sort(); // Сортируем названия свойств для консистентности
    
  return sortingProperties
    .map(prop => `${prop}:${variant.variantProperties[prop]}`)
    .join('|');
}

// Функция для получения эталонного порядка сортировки
function getReferenceSortingOrder(variants, groupByProperty) {
  const sortingKeys = new Set();
  
  variants.forEach(variant => {
    const key = createSortingKey(variant, groupByProperty);
    if (key) sortingKeys.add(key);
  });
  
  return Array.from(sortingKeys).sort();
}

// Функция для сортировки вариантов в группе по эталонному порядку
function sortVariantsByReference(variants, groupByProperty, referenceSortingOrder) {
  return variants.sort((a, b) => {
    const keyA = createSortingKey(a, groupByProperty);
    const keyB = createSortingKey(b, groupByProperty);
    
    const indexA = referenceSortingOrder.indexOf(keyA);
    const indexB = referenceSortingOrder.indexOf(keyB);
    
    // Если ключ не найден в эталонном порядке, помещаем в конец
    const finalIndexA = indexA === -1 ? referenceSortingOrder.length : indexA;
    const finalIndexB = indexB === -1 ? referenceSortingOrder.length : indexB;
    
    return finalIndexA - finalIndexB;
  });
}

// Функция для группировки вариантов по свойству
function groupVariantsByProperty(variants, property) {
  const groups = {};
  
  variants.forEach(variant => {
    if (variant.variantProperties && variant.variantProperties[property]) {
      const value = variant.variantProperties[property];
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(variant);
    } else {
      // Варианты без указанного свойства попадают в группу "Other"
      if (!groups['Other']) {
        groups['Other'] = [];
      }
      groups['Other'].push(variant);
    }
  });
  
  return groups;
}

// Функция для выравнивания вариантов компонента в Grid
function alignComponentVariants(componentSet, padding = 40, spacing = 20, columns = 2, groupByProperty = null) {
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

    let arrangedVariants = variants;
    let actualColumns = Math.min(columns, variants.length);
    
    // Если выбрано свойство для группировки
    if (groupByProperty && groupByProperty !== 'none') {
      const groups = groupVariantsByProperty(variants, groupByProperty);
      const groupKeys = Object.keys(groups);
      
      if (groupKeys.length > 1) {
        // Получаем эталонный порядок сортировки
        const referenceSortingOrder = getReferenceSortingOrder(variants, groupByProperty);
        
        // Сортируем варианты в каждой группе по эталонному порядку
        groupKeys.forEach(groupKey => {
          groups[groupKey] = sortVariantsByReference(groups[groupKey], groupByProperty, referenceSortingOrder);
        });
        
        // Устанавливаем количество колонок равное количеству групп
        actualColumns = groupKeys.length;
        
        // Переупорядочиваем варианты по группам
        arrangedVariants = [];
        groupKeys.forEach(groupKey => {
          arrangedVariants = arrangedVariants.concat(groups[groupKey]);
        });
        
        figma.notify(`Варианты сгруппированы по "${groupByProperty}": ${groupKeys.join(', ')} с синхронной сортировкой`);
      } else {
        figma.notify(`Все варианты имеют одинаковое значение "${groupByProperty}"`);
      }
    }
    
    // Отключаем auto-layout и включаем Grid
    componentSet.layoutMode = 'NONE';
    
    // Создаем Grid layout
    if (groupByProperty && groupByProperty !== 'none') {
      setupGridLayoutByGroups(componentSet, variants, spacing, groupByProperty, padding);
    } else {
      setupGridLayout(componentSet, arrangedVariants, spacing, actualColumns, padding);
    }

    figma.notify(`Варианты выровнены в Grid ${actualColumns} колонок! Паддинг: ${padding}px, отступ: ${spacing}px`);
  } catch (error) {
    figma.notify('Ошибка при выравнивании: ' + error.message);
  }
}

// Функция для создания Grid layout с группировкой
function setupGridLayoutByGroups(componentSet, variants, spacing, groupByProperty, padding) {
  const groups = groupVariantsByProperty(variants, groupByProperty);
  const groupKeys = Object.keys(groups).sort(); // Сортируем ключи групп для консистентности
  
  // Получаем эталонный порядок сортировки
  const referenceSortingOrder = getReferenceSortingOrder(variants, groupByProperty);
  
  // Сортируем варианты в каждой группе
  groupKeys.forEach(groupKey => {
    groups[groupKey] = sortVariantsByReference(groups[groupKey], groupByProperty, referenceSortingOrder);
  });
  
  // Находим максимальные размеры среди всех компонентов
  let maxWidth = 0;
  let maxHeight = 0;
  
  variants.forEach(variant => {
    if (variant.width > maxWidth) maxWidth = variant.width;
    if (variant.height > maxHeight) maxHeight = variant.height;
  });
  
  // Находим максимальное количество элементов в группе для расчета высоты
  const maxItemsInGroup = Math.max(...groupKeys.map(key => groups[key].length));
  
  // Позиционируем компоненты по группам (колонкам)
  groupKeys.forEach((groupKey, groupIndex) => {
    const groupVariants = groups[groupKey];
    
    groupVariants.forEach((variant, itemIndex) => {
      const x = padding + groupIndex * (maxWidth + spacing);
      const y = padding + itemIndex * (maxHeight + spacing);
      
      variant.x = x;
      variant.y = y;
    });
  });
  
  // Устанавливаем размер ComponentSet
  const totalWidth = groupKeys.length * maxWidth + (groupKeys.length - 1) * spacing + 2 * padding;
  const totalHeight = maxItemsInGroup * maxHeight + (maxItemsInGroup - 1) * spacing + 2 * padding;
  
  componentSet.resize(totalWidth, totalHeight);
}

// Функция для создания обычного Grid layout
function setupGridLayout(componentSet, variants, spacing, columns, padding) {
  // Рассчитываем количество строк
  const rows = Math.ceil(variants.length / columns);
  
  // Находим размеры самого большого компонента для определения размера ячеек
  let maxWidth = 0;
  let maxHeight = 0;
  
  variants.forEach(variant => {
    if (variant.width > maxWidth) maxWidth = variant.width;
    if (variant.height > maxHeight) maxHeight = variant.height;
  });
  
  // Позиционируем компоненты в сетке
  variants.forEach((variant, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    // Рассчитываем позицию с учетом padding и spacing
    const x = padding + col * (maxWidth + spacing);
    const y = padding + row * (maxHeight + spacing);
    
    variant.x = x;
    variant.y = y;
  });
  
  // Устанавливаем размер ComponentSet с учетом содержимого и паддинга
  const totalWidth = columns * maxWidth + (columns - 1) * spacing + 2 * padding;
  const totalHeight = rows * maxHeight + (rows - 1) * spacing + 2 * padding;
  
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
    const columns = msg.columns || 2;
    const groupByProperty = msg.groupByProperty || null;

    alignComponentVariants(componentSet, padding, spacing, columns, groupByProperty);
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Инициализация - отправляем информацию о текущем выделении
updateSelectionInfo();
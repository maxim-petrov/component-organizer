// Плагин для выравнивания вариантов компонента
figma.showUI(__html__, { width: 360, height: 550 });

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
  groupProperties = [], 
  columnProperty = null
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
    
    if (groupProperties.length > 0 || columnProperty) {
      // Многоуровневая группировка
      const groups = createMultiLevelGroups(variants, groupProperties, columnProperty);
      setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing);
      
      const groupCount = Object.keys(groups).length;
      const totalColumns = Object.values(groups).reduce((max, group) => 
        Math.max(max, Object.keys(group).length), 0);
        
      figma.notify(`Создано ${groupCount} групп с ${totalColumns} максимум колонок в группе`);
    } else {
      // Простая сетка без группировки
      setupSimpleGridLayout(componentSet, variants, padding, spacing);
      figma.notify(`Варианты выровнены в простую сетку`);
    }

  } catch (error) {
    figma.notify('Ошибка при выравнивании: ' + error.message);
    console.error(error);
  }
}

// Функция для создания многоуровневого Grid layout
function setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing) {
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
  let currentGroupX = padding;
  let totalHeight = 0;
  
  groupKeys.forEach((groupKey, groupIndex) => {
    const group = groups[groupKey];
    const columnKeys = Object.keys(group).sort();
    
    // Находим максимальное количество элементов в колонке этой группы
    const maxItemsInGroup = Math.max(...columnKeys.map(key => group[key].length));
    const groupHeight = maxItemsInGroup * maxHeight + (maxItemsInGroup - 1) * spacing;
    
    // Позиционируем колонки внутри группы
    columnKeys.forEach((columnKey, columnIndex) => {
      const columnVariants = group[columnKey];
      const columnX = currentGroupX + columnIndex * (maxWidth + columnSpacing);
      
      // Позиционируем варианты внутри колонки
      columnVariants.forEach((variant, itemIndex) => {
        variant.x = columnX;
        variant.y = padding + itemIndex * (maxHeight + spacing);
      });
    });
    
    // Обновляем позицию для следующей группы
    const groupWidth = columnKeys.length * maxWidth + (columnKeys.length - 1) * columnSpacing;
    currentGroupX += groupWidth + groupSpacing;
    
    // Обновляем общую высоту
    totalHeight = Math.max(totalHeight, groupHeight);
  });
  
  // Рассчитываем общие размеры ComponentSet
  const totalWidth = currentGroupX - groupSpacing + padding; // Убираем последний groupSpacing
  const finalHeight = totalHeight + 2 * padding;
  
  componentSet.resize(totalWidth, finalHeight);
  
  console.log(`Groups positioned: ${groupKeys.length} groups, total size: ${totalWidth}x${finalHeight}`);
}

// Функция для создания простого Grid layout (резервная)
function setupSimpleGridLayout(componentSet, variants, padding, spacing) {
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
  });
  
  const totalWidth = maxWidth + 2 * padding;
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
    const groupProperties = msg.groupProperties || [];
    const columnProperty = msg.columnProperty || null;

    alignComponentVariants(
      componentSet, 
      padding, 
      spacing, 
      columnSpacing, 
      groupSpacing, 
      groupProperties, 
      columnProperty
    );
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Инициализация - отправляем информацию о текущем выделении
updateSelectionInfo();
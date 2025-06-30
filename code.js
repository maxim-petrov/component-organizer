// Плагин для выравнивания вариантов компонента
figma.showUI(__html__, { width: 360, height: 420 });

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
        // Устанавливаем количество колонок равное количеству групп
        actualColumns = groupKeys.length;
        
        // Переупорядочиваем варианты по группам
        arrangedVariants = [];
        groupKeys.forEach(groupKey => {
          arrangedVariants = arrangedVariants.concat(groups[groupKey]);
        });
        
        figma.notify(`Варианты сгруппированы по "${groupByProperty}": ${groupKeys.join(', ')}`);
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
  const groupKeys = Object.keys(groups);
  
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

// Обработчик сообщений от UI
figma.ui.onmessage = (msg) => {
  if (msg.type === 'get-properties') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.ui.postMessage({ type: 'properties', data: [] });
      return;
    }

    let componentSet = null;
    
    for (const node of selection) {
      if (node.type === 'COMPONENT_SET') {
        componentSet = node;
        break;
      } else if (node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET') {
        componentSet = node.parent;
        break;
      }
    }
    
    if (componentSet) {
      const properties = getVariantProperties(componentSet);
      figma.ui.postMessage({ type: 'properties', data: properties });
    } else {
      figma.ui.postMessage({ type: 'properties', data: [] });
    }
  }
  
  if (msg.type === 'align-variants') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('Выберите набор компонентов');
      return;
    }

    const padding = msg.padding || 40;
    const spacing = msg.spacing || 20;
    const columns = msg.columns || 2;
    const groupByProperty = msg.groupByProperty || null;

    // Проверяем каждый выбранный элемент
    let foundComponentSet = false;
    
    for (const node of selection) {
      if (node.type === 'COMPONENT_SET') {
        alignComponentVariants(node, padding, spacing, columns, groupByProperty);
        foundComponentSet = true;
      } else if (node.type === 'COMPONENT') {
        // Если выбран отдельный компонент, ищем его родительский ComponentSet
        if (node.parent && node.parent.type === 'COMPONENT_SET') {
          alignComponentVariants(node.parent, padding, spacing, columns, groupByProperty);
          foundComponentSet = true;
        }
      }
    }
    
    if (!foundComponentSet) {
      figma.notify('Выберите набор компонентов или компонент внутри набора');
    }
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
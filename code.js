// Плагин для выравнивания вариантов компонента
figma.showUI(__html__, { width: 320, height: 320 });

// Функция для выравнивания вариантов компонента в Grid
function alignComponentVariants(componentSet, padding = 40, spacing = 20, columns = 2) {
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

    // Если колонок больше чем вариантов, устанавливаем количество колонок равное количеству вариантов
    const actualColumns = Math.min(columns, variants.length);
    
    // Отключаем auto-layout и включаем Grid
    componentSet.layoutMode = 'NONE';
    
    // Создаем Grid layout
    setupGridLayout(componentSet, variants, spacing, actualColumns, padding);

    figma.notify(`Варианты выровнены в Grid ${actualColumns} колонок! Паддинг: ${padding}px, отступ: ${spacing}px`);
  } catch (error) {
    figma.notify('Ошибка при выравнивании: ' + error.message);
  }
}

// Функция для создания Grid layout
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
  if (msg.type === 'align-variants') {
    const selection = figma.currentPage.selection;
    
    if (selection.length === 0) {
      figma.notify('Выберите набор компонентов');
      return;
    }

    const padding = msg.padding || 40;
    const spacing = msg.spacing || 20;
    const columns = msg.columns || 2;

    // Проверяем каждый выбранный элемент
    let foundComponentSet = false;
    
    for (const node of selection) {
      if (node.type === 'COMPONENT_SET') {
        alignComponentVariants(node, padding, spacing, columns);
        foundComponentSet = true;
      } else if (node.type === 'COMPONENT') {
        // Если выбран отдельный компонент, ищем его родительский ComponentSet
        if (node.parent && node.parent.type === 'COMPONENT_SET') {
          alignComponentVariants(node.parent, padding, spacing, columns);
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
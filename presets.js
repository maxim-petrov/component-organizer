// Предустановленные настройки для компонентов с поддержкой группировки
const componentPresets = {
  // Группы многосоставных компонентов
  groups: {
    'Accordion': {
      name: 'Accordion',
      description: 'Компоненты аккордеона',
      components: {
        'AccordionRow v2': {
          padding: 140,
          spacing: 20,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 2,
          columnDirection: 'horizontal',
          groupProperties: ['Opened', 'Align'],
          columnProperty: 'Type',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Accordion Group v2': {
          padding: 20,
          spacing: 16,
          columnSpacing: 16,
          groupSpacing: 40,
          groupsPerRow: 3,
          columnDirection: 'vertical',
          groupProperties: ['Type'],
          columnProperty: null,
          showAnnotations: false,
          annotationSpacing: 24
        }
      }
    },
    'Input': {
      name: 'Input',
      description: 'Компоненты ввода данных',
      components: {
        'Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 3,
          columnDirection: 'horizontal',
          groupProperties: ['State', 'Size'],
          columnProperty: 'Type',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Phone Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 2,
          columnDirection: 'horizontal',
          groupProperties: ['State'],
          columnProperty: 'Size',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Masked Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 2,
          columnDirection: 'horizontal',
          groupProperties: ['State'],
          columnProperty: 'Type',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Number Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 3,
          columnDirection: 'horizontal',
          groupProperties: ['State'],
          columnProperty: 'Size',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Password Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 2,
          columnDirection: 'horizontal',
          groupProperties: ['State', 'Visibility'],
          columnProperty: 'Size',
          showAnnotations: true,
          annotationSpacing: 24
        },
        'Custom Input': {
          padding: 20,
          spacing: 16,
          columnSpacing: 40,
          groupSpacing: 80,
          groupsPerRow: 2,
          columnDirection: 'horizontal',
          groupProperties: ['State'],
          columnProperty: 'Type',
          showAnnotations: true,
          annotationSpacing: 24
        }
      }
    }
  },

  // Одиночные компоненты (не многосоставные)
  components: {
    'Alert': {
      padding: 20,
      spacing: 40,
      columnSpacing: 80,
      groupSpacing: 160,
      groupsPerRow: 2,
      columnDirection: 'horizontal',
      groupProperties: ['Type'],
      columnProperty: 'Info Type',
      showAnnotations: true,
      annotationSpacing: 24
    },
    'Avatar': {
      padding: 16,
      spacing: 20,
      columnSpacing: 40,
      groupSpacing: 80,
      groupsPerRow: 4,
      columnDirection: 'horizontal',
      groupProperties: ['State'],
      columnProperty: 'Size',
      showAnnotations: true,
      annotationSpacing: 24
    }
  }
};

// Функция для получения предустановки для компонента (обновленная)
function getComponentPreset(componentName) {
  // Сначала ищем среди одиночных компонентов
  if (componentPresets.components && componentPresets.components[componentName]) {
    return componentPresets.components[componentName];
  }

  // Затем ищем среди групп
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      if (group.components && group.components[componentName]) {
        return group.components[componentName];
      }
    }
  }

  return null;
}

// Функция для получения группы компонента
function getComponentGroup(componentName) {
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      if (group.components && group.components[componentName]) {
        return {
          key: groupKey,
          name: group.name,
          description: group.description,
          components: Object.keys(group.components)
        };
      }
    }
  }
  return null;
}

// Функция для получения списка всех доступных предустановок (обновленная)
function getAllPresets() {
  const allPresets = {};
  
  // Добавляем одиночные компоненты
  if (componentPresets.components) {
    Object.assign(allPresets, componentPresets.components);
  }
  
  // Добавляем компоненты из групп
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      if (group.components) {
        Object.assign(allPresets, group.components);
      }
    }
  }
  
  return allPresets;
}

// Функция для получения списка всех групп
function getAllGroups() {
  return componentPresets.groups || {};
}

// Функция для добавления новой предустановки (обновленная)
function addComponentPreset(componentName, preset, groupName = null) {
  if (groupName && componentPresets.groups && componentPresets.groups[groupName]) {
    // Добавляем в группу
    componentPresets.groups[groupName].components[componentName] = preset;
  } else {
    // Добавляем как одиночный компонент
    if (!componentPresets.components) {
      componentPresets.components = {};
    }
    componentPresets.components[componentName] = preset;
  }
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    componentPresets,
    getComponentPreset,
    getComponentGroup,
    getAllPresets,
    getAllGroups,
    addComponentPreset
  };
} 
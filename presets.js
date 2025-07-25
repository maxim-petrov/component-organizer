// Предустановленные настройки для компонентов с поддержкой группировки по Desktop/Mobile
const componentPresets = {
  // Группы многосоставных компонентов
  groups: {
    'Accordion': {
      name: 'Accordion',
      description: 'Компоненты аккордеона',
      'Desktop': {
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4,
                'Disabled': 5
              },
              'Opened': {
                'False': 1,
                'True': 2
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'Type': {
                'Primary': 1,
                'Secondary': 2,
                'Tertiary': 3
              }
            }
          }
        }
      },
      'Mobile': {
        components: {
          'Accordion v2': {
            padding: 60,
            spacing: 10,
            columnSpacing: 40,
            groupSpacing: 80,
            groupsPerRow: 2,
            columnDirection: 'horizontal',
            groupProperties: ['Opened', 'Align'],
            columnProperty: 'Type',
            showAnnotations: true,
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4
              }
            }
          },
          'Accordion Group v2': {
            padding: 20,
            spacing: 10,
            columnSpacing: 40,
            groupSpacing: 80,
            groupsPerRow: 2,
            columnDirection: 'horizontal',
            groupProperties: ['Opened', 'Align'],
            columnProperty: 'Type',
            showAnnotations: true,
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Active': 2,
                'Hover': 3,
                'Focus': 4
              }
            }
          }
        }
      }
    },
    'Input': {
      name: 'Input',
      description: 'Компоненты ввода данных',
      'Desktop': {
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4,
                'Error': 5,
                'Disabled': 6
              },
              'Size': {
                'Small': 1,
                'Medium': 2,
                'Large': 3
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Focus': 2,
                'Error': 3,
                'Disabled': 4
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4,
                'Error': 5
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4,
                'Error': 5,
                'Disabled': 6
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4,
                'Error': 5,
                'Disabled': 6
              },
              'Visibility': {
                'Hidden': 1,
                'Visible': 2
              }
            }
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
            annotationSpacing: 24,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Hover': 2,
                'Active': 3,
                'Focus': 4
              }
            }
          }
        }
      },
      'Mobile': {
        components: {
          'Input': {
            padding: 16,
            spacing: 12,
            columnSpacing: 30,
            groupSpacing: 60,
            groupsPerRow: 2,
            columnDirection: 'horizontal',
            groupProperties: ['State', 'Size'],
            columnProperty: 'Type',
            showAnnotations: true,
            annotationSpacing: 20,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Focus': 2,
                'Error': 3,
                'Disabled': 4
              },
              'Size': {
                'Medium': 1,
                'Large': 2
              }
            }
          },
          'Phone Input': {
            padding: 16,
            spacing: 12,
            columnSpacing: 30,
            groupSpacing: 60,
            groupsPerRow: 1,
            columnDirection: 'vertical',
            groupProperties: ['State'],
            columnProperty: 'Size',
            showAnnotations: true,
            annotationSpacing: 20,
            sortingOrder: {
              'State': {
                'Default': 1,
                'Focus': 2,
                'Error': 3
              }
            }
          }
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
      annotationSpacing: 24,
      sortingOrder: {
        'Type': {
          'Info': 1,
          'Success': 2,
          'Warning': 3,
          'Error': 4
        },
        'Info Type': {
          'Default': 1,
          'Compact': 2,
          'Detailed': 3
        }
      }
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
      annotationSpacing: 24,
      sortingOrder: {
        'Size': {
          'XS': 1,
          'S': 2,
          'M': 3,
          'L': 4,
          'XL': 5
        },
        'State': {
          'Default': 1,
          'Hover': 2,
          'Selected': 3,
          'Disabled': 4
        }
      }
    }
  }
};

// Функция для получения предустановки для компонента (обновленная для Desktop/Mobile)
function getComponentPreset(componentName, platform = null) {
  // Сначала ищем среди одиночных компонентов
  if (componentPresets.components && componentPresets.components[componentName]) {
    return componentPresets.components[componentName];
  }

  // Затем ищем среди групп с учетом платформы
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      
      // Если платформа указана, ищем только в ней
      if (platform && group[platform] && group[platform].components && group[platform].components[componentName]) {
        return group[platform].components[componentName];
      }
      
      // Если платформа не указана, ищем в любой доступной (приоритет Desktop)
      if (!platform) {
        if (group['Desktop'] && group['Desktop'].components && group['Desktop'].components[componentName]) {
          return group['Desktop'].components[componentName];
        }
        if (group['Mobile'] && group['Mobile'].components && group['Mobile'].components[componentName]) {
          return group['Mobile'].components[componentName];
        }
      }
    }
  }

  return null;
}

// Функция для получения доступных платформ для компонента
function getComponentPlatforms(componentName) {
  const platforms = [];
  
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      
      if (group['Desktop'] && group['Desktop'].components && group['Desktop'].components[componentName]) {
        platforms.push('Desktop');
      }
      if (group['Mobile'] && group['Mobile'].components && group['Mobile'].components[componentName]) {
        platforms.push('Mobile');
      }
    }
  }
  
  return platforms;
}

// Функция для получения группы компонента (обновленная)
function getComponentGroup(componentName) {
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      const platforms = [];
      const allComponents = new Set();
      
      // Собираем информацию о всех платформах и компонентах
      ['Desktop', 'Mobile'].forEach(platform => {
        if (group[platform] && group[platform].components) {
          if (group[platform].components[componentName]) {
            platforms.push(platform);
          }
          Object.keys(group[platform].components).forEach(comp => allComponents.add(comp));
        }
      });
      
      if (platforms.length > 0) {
        return {
          key: groupKey,
          name: group.name,
          description: group.description,
          platforms: platforms,
          components: Array.from(allComponents)
        };
      }
    }
  }
  return null;
}

// Функция для получения списка всех доступных предустановок (обновленная)
function getAllPresets(platform = null) {
  const allPresets = {};
  
  // Добавляем одиночные компоненты
  if (componentPresets.components) {
    Object.assign(allPresets, componentPresets.components);
  }
  
  // Добавляем компоненты из групп
  if (componentPresets.groups) {
    for (const groupKey in componentPresets.groups) {
      const group = componentPresets.groups[groupKey];
      
      if (platform) {
        // Если указана платформа, берем только её
        if (group[platform] && group[platform].components) {
          Object.assign(allPresets, group[platform].components);
        }
      } else {
        // Если платформа не указана, берем все (приоритет Desktop)
        ['Desktop', 'Mobile'].forEach(plt => {
          if (group[plt] && group[plt].components) {
            Object.assign(allPresets, group[plt].components);
          }
        });
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
function addComponentPreset(componentName, preset, groupName = null, platform = null) {
  if (groupName && componentPresets.groups && componentPresets.groups[groupName]) {
    if (platform && ['Desktop', 'Mobile'].includes(platform)) {
      // Добавляем в группу на определенной платформе
      if (!componentPresets.groups[groupName][platform]) {
        componentPresets.groups[groupName][platform] = { components: {} };
      }
      componentPresets.groups[groupName][platform].components[componentName] = preset;
    } else {
      // Добавляем в Desktop по умолчанию
      if (!componentPresets.groups[groupName]['Desktop']) {
        componentPresets.groups[groupName]['Desktop'] = { components: {} };
      }
      componentPresets.groups[groupName]['Desktop'].components[componentName] = preset;
    }
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
    getComponentPlatforms,
    getComponentGroup,
    getAllPresets,
    getAllGroups,
    addComponentPreset
  };
} 
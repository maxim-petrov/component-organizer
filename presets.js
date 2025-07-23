// Предустановленные настройки для компонентов
const componentPresets = {
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
  },
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
  }
};

// Функция для получения предустановки для компонента
function getComponentPreset(componentName) {
  return componentPresets[componentName] || null;
}

// Функция для получения списка всех доступных предустановок
function getAllPresets() {
  return componentPresets;
}

// Функция для добавления новой предустановки
function addComponentPreset(componentName, preset) {
  componentPresets[componentName] = preset;
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    componentPresets,
    getComponentPreset,
    getAllPresets,
    addComponentPreset
  };
} 
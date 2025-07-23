# 🚀 Быстрый старт

## Установка
```bash
npm run build
```

## Загрузка в Figma
1. Figma → Plugins → Development → Import plugin from manifest...
2. Выберите `dist/manifest.json`

## Добавление предустановки
1. Откройте `presets.js`
2. Добавьте новый компонент:
```javascript
'Your Component': {
  padding: 40,
  spacing: 20,
  columnSpacing: 40,
  groupSpacing: 80,
  groupsPerRow: 2,
  columnDirection: 'horizontal',
  groupProperties: ['Size'],
  columnProperty: 'State',
  showAnnotations: true,
  annotationSpacing: 24
}
```
3. Пересоберите: `npm run build`

## Разработка
```bash
npm run dev  # Автоматическая пересборка при изменениях
```

Готово! 🎉 
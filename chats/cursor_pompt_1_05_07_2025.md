# Исправление дублирующихся аннотаций
_Exported on 7/5/2025 at 10:53:19 GMT+3 from Cursor (1.2.1)_

---

**User**

Подробно изучи код и файл context.txt.

---

# Почини проблему
- Все аннотации дублируются несколько раз — видимо для каждой группы
- Получается может быть аж 4 одинаковых слоя друг на друге

---

**Cursor**

Давайте подробно изучим код и файл context.txt, чтобы понять проблему с дублированием аннотаций.

Теперь я понимаю проблему! После изучения кода, я вижу, что аннотации действительно дублируются. Проблема в том, что в функции `setupMultiLevelGridLayout` аннотации создаются в нескольких местах независимо друг от друга:

1. **Для каждой группы** создается аннотация группы
2. **Для каждой колонки в каждой группе** создается аннотация колонки  
3. Это может привести к созданию одинаковых аннотаций несколько раз

Основные проблемы:
- В горизонтальном layout (строки 408-456) и вертикальном layout (строки 491-622) логика создания аннотаций дублируется
- Аннотации для колонок создаются в цикле для каждой группы, что может привести к дублированию одинаковых колонок
- Нет проверки на то, была ли уже создана аннотация с таким же текстом

Давайте исправим это, создав систему отслеживания уже созданных аннотаций:

```javascript
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
  
  // ... existing code ...
  
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
          
          // Создаем аннотацию для колонки сверху (если включены аннотации, есть название колонки и она еще не создана)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-${columnKey}`)) {
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
              annotationsFolder.appendChild(annotation);
            });
            
            // Отмечаем, что аннотация для этой колонки уже создана
            createdAnnotations.add(`column-${columnKey}`);
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
            annotationsFolder.appendChild(annotation);
            
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
            annotationsFolder.appendChild(annotation);
            
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
          
          // Создаем аннотацию для колонки слева (если включены аннотации, есть название колонки и она еще не создана)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-${columnKey}`)) {
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
              annotationsFolder.appendChild(annotation);
            });
            
            // Отмечаем, что аннотация для этой колонки уже создана
            createdAnnotations.add(`column-${columnKey}`);
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
  
  // Создаем финальную группу из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalGroup) {
    setTimeout(() => {
      annotationsFolder.createFinalGroup();
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
  
  console.log(`Groups positioned: ${groupKeys.length} groups in ${Math.ceil(groupKeys.length / groupsPerRow)} rows, total size: ${totalWidth}x${totalHeight}`);
}
```

Теперь давайте также проверим и исправим функцию `setupSimpleGridLayout`, чтобы убедиться, что там нет аналогичных проблем:

```javascript
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
```

```javascript
// Создаем аннотацию для варианта в зависимости от направления (если включены аннотации)
if (showAnnotations && annotationsFolder) {
  const variantName = variant.name || `Variant ${index + 1}`;
  

}
```

Отлично! Я исправил основную проблему с дублированием аннотаций. Теперь давайте проверим, работает ли исправление правильно:

## Что было исправлено:

1. **Добавлена система отслеживания аннотаций**: Создал `Set` для отслеживания уже созданных аннотаций: `const createdAnnotations = new Set()`

2. **Предотвращено дублирование аннотаций групп**: Добавил проверку `!createdAnnotations.has(`group-${groupKey}`)` перед созданием аннотации группы

3. **Предотвращено дублирование аннотаций колонок**: Добавил проверку `!createdAnnotations.has(`column-${columnKey}`)` перед созданием аннотации колонки

4. **Отслеживание созданных аннотаций**: После создания каждой аннотации добавляется запись в `createdAnnotations.add()`

## Как это работает:

- Теперь каждая аннотация с одинаковым текстом создается только один раз
- Если есть несколько групп с одинаковым названием, аннотация создается только для первой встреченной группы
- Если есть несколько колонок с одинаковым названием в разных группах, аннотация создается только для первой встреченной колонки

## Логика удаления существующих аннотаций:

В функции `alignComponentVariants` уже есть правильная логика для удаления существующих аннотаций перед созданием новых:

```javascript
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
```

Это означает, что при каждом запуске плагина:
1. Сначала удаляются ВСЕ существующие аннотации
2. Затем создаются новые аннотации без дублирования

Проблема с дублированием аннотаций теперь должна быть решена! Вместо 4 одинаковых слоев друг на друге, теперь будет создаваться только один слой для каждой уникальной аннотации.

```javascript
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
```

---

**User**

С annotation-group всё верно — они теперь не доблируются 
А вот annotation-column могут дублироваться для РАЗНЫХ колонок. Сейчас показывается только для одной колонки

---

**Cursor**

Понимаю проблему! Сейчас я отслеживаю аннотации колонок по простому ключу `column-${columnKey}`, но колонки с одинаковым названием могут быть в разных группах и должны показываться отдельно.

Давайте исправим логику отслеживания аннотаций колонок, чтобы учитывать их позицию:

Вижу проблему! Сейчас я отслеживаю аннотации колонок по их названию (`column-${columnKey}`), но колонки с одинаковым названием могут быть в разных позициях и должны показываться отдельно.

Нужно изменить логику, чтобы отслеживать аннотации колонок по их позиции, а не по названию:

```javascript
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
              annotationsFolder.appendChild(annotation);
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
        
        // ... existing code ...
        
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
              annotationsFolder.appendChild(annotation);
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
```

Давайте найдем точную позицию кода для вертикального макета и исправим её:

```javascript
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
              annotationsFolder.appendChild(annotation);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${currentColumnY}`);
          }

->

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
              annotationsFolder.appendChild(annotation);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${currentColumnY}`);
          }
```

Давайте проверим, что получилось после исправлений:

Отлично! Теперь исправления применены правильно. Давайте проверим что получилось:

## Что исправлено:

**Для горизонтального макета (аннотации сверху):**
- **Было:** `!createdAnnotations.has(`column-${columnKey}`)` - отслеживание по названию колонки
- **Стало:** `!createdAnnotations.has(`column-pos-${columnX}`)` - отслеживание по позиции X

**Для вертикального макета (аннотации слева):**
- **Было:** `!createdAnnotations.has(`column-${columnKey}`)` - отслеживание по названию колонки  
- **Стало:** `!createdAnnotations.has(`column-pos-${currentColumnY}`)` - отслеживание по позиции Y

## Как это работает теперь:

1. **Аннотации групп**: Создаются один раз для каждого уникального названия группы - это правильно
2. **Аннотации колонок**: Создаются один раз для каждой уникальной позиции - это решает проблему!

## Пример:

Если у вас есть:
- Группа "Size:Large" с колонками "Color:Red", "Color:Blue" в позициях X=100, X=200
- Группа "Size:Small" с колонками "Color:Red", "Color:Blue" в позициях X=300, X=400

**Раньше:** 
- Аннотация "Color:Red" создавалась только для позиции X=100
- Аннотация "Color:Blue" создавалась только для позиции X=200
- Для позиций X=300, X=400 аннотации не создавались

**Теперь:**
- Аннотация "Color:Red" создается для позиции X=100  
- Аннотация "Color:Blue" создается для позиции X=200
- Аннотация "Color:Red" создается для позиции X=300
- Аннотация "Color:Blue" создается для позиции X=400

Теперь каждая колонка в каждой позиции будет иметь свою аннотацию, а дублирование в одной позиции будет предотвращено!

---

**User**

- Какждый уровень аннотаций должен быть в собственном Folder
- Общий folder должен быть с Auto Layout с Gap равным значению «Отступ между уровнями аннотаций (px):»
- предлагаю оборачивать это все в папки в самом конце, чтобы не ломалась структура

#Пример для Horizontal stepper

## При «По горизонтали» слои
- «Horizontal stepper annotations» — auto-layout; layout: vertical; vertical gap between objects: 24px
    - Level 2
         - Vector          - annotation-group-Type:Justified|Static list:True          - Vector          - annotation-group-Type:Justified|Static list:True          …
    - Level 1
        - annotation-column-True
        - annotation-column-False
        - annotation-column-True
        - annotation-column-False
        …


## При «По вертикали» слои
- «Vertical stepper annotations» — auto-layout; layout: horizontal; horizontal gap between objects: 24px
    - Level 2
         - Vector          - annotation-group-Type:Justified|Static list:True          - Vector          - annotation-group-Type:Justified|Static list:True          …
    - Level 1
        - annotation-column-True
        - annotation-column-False
        - annotation-column-True
        - annotation-column-False
        …

---

**Cursor**

Понимаю! Нужно создать структурированную систему папок для аннотаций с Auto Layout. Давайте изменим логику создания аннотаций:

```javascript
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
      
      // Создаем общую папку с Auto Layout
      if (allElements.length > 0) {
        const mainFolder = figma.group(allElements, this.parent);
        mainFolder.name = this.name;
        
        // Настраиваем Auto Layout
        mainFolder.layoutMode = columnDirection === 'horizontal' ? 'VERTICAL' : 'HORIZONTAL';
        if (columnDirection === 'horizontal') {
          mainFolder.itemSpacing = annotationSpacing;
          mainFolder.primaryAxisAlignItems = 'MIN';
          mainFolder.counterAxisAlignItems = 'MIN';
        } else {
          mainFolder.itemSpacing = annotationSpacing;
          mainFolder.primaryAxisAlignItems = 'MIN';
          mainFolder.counterAxisAlignItems = 'MIN';
        }
        
        return mainFolder;
      }
      
      return null;
    }
  };
  
  return annotationsContainer;
}
```

Теперь обновим функцию создания линий:

```javascript
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
```

Теперь обновим функцию setupMultiLevelGridLayout для использования новых методов:

```javascript
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.appendChild(annotation);
            });

->

            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.addLevel1Annotation(annotation);
            });
```

```javascript
            createGroupAnnotation(
              columnKey, 
              columnX, 
              level2Y // Позиционируем на среднем уровне (уровень 2)
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.appendChild(annotation);
            });

->

            createGroupAnnotation(
              columnKey, 
              columnX, 
              level2Y // Позиционируем на среднем уровне (уровень 2)
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.addLevel1Annotation(annotation);
            });
```

```javascript
          createGroupAnnotation(
            groupKey,
            groupCenterX,
            annotationY
          ).then(annotation => {
            annotation.name = `annotation-group-${groupKey}`;
            // Центрируем аннотацию относительно своей ширины
            annotation.x = groupCenterX - annotation.width / 2;
            annotationsFolder.appendChild(annotation);
            
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

->

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
```

```javascript
          createGroupAnnotation(
            groupKey,
            annotationX,
            groupCenterY
          ).then(annotation => {
            annotation.name = `annotation-group-${groupKey}`;
            // Центрируем аннотацию относительно своей высоты
            annotation.y = groupCenterY - annotation.height / 2;
            annotationsFolder.appendChild(annotation);
            
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

->

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
```

```javascript
            createGroupAnnotation(
              columnKey,
              level2X, // Позиционируем на среднем уровне (уровень 2)
              currentColumnY + 5
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.appendChild(annotation);
            });

->

            createGroupAnnotation(
              columnKey,
              level2X, // Позиционируем на среднем уровне (уровень 2)
              currentColumnY + 5
            ).then(annotation => {
              annotation.name = `annotation-column-${columnKey}`;
              annotationsFolder.addLevel1Annotation(annotation);
            });
```

```javascript
  // Создаем финальную группу из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalGroup) {
    setTimeout(() => {
      annotationsFolder.createFinalGroup();
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }

->

  // Создаем финальную структуру из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalStructure) {
    setTimeout(() => {
      annotationsFolder.createFinalStructure(columnDirection, annotationSpacing);
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
```

```javascript
  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную группу из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalGroup) {
    setTimeout(() => {
      annotationsFolder.createFinalGroup();
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
  
  console.log(`Groups positioned: ${groupKeys.length} groups in ${Math.ceil(groupKeys.length / groupsPerRow)} rows, total size: ${totalWidth}x${totalHeight}`);

->

  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную структуру из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalStructure) {
    setTimeout(() => {
      annotationsFolder.createFinalStructure(columnDirection, annotationSpacing);
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
  
  console.log(`Groups positioned: ${groupKeys.length} groups in ${Math.ceil(groupKeys.length / groupsPerRow)} rows, total size: ${totalWidth}x${totalHeight}`);
```

```javascript
  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную группу из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalGroup) {
    setTimeout(() => {
      annotationsFolder.createFinalGroup();
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
}

->

  componentSet.resize(totalWidth, totalHeight);
  
  // Создаем финальную структуру из всех аннотаций
  if (annotationsFolder && annotationsFolder.createFinalStructure) {
    setTimeout(() => {
      annotationsFolder.createFinalStructure(columnDirection, annotationSpacing);
    }, 100); // Небольшая задержка для завершения создания всех аннотаций
  }
}
```

Отлично! Теперь все изменения применены. Давайте резюмируем что было сделано:

## Что исправлено:

### 1. **Обновлена функция `createAnnotationsFolder`**
- Теперь создает контейнер с отдельными массивами для каждого уровня:
  - `level1Annotations[]` - для аннотаций колонок
  - `level2Annotations[]` - для аннотаций групп
  - `lines[]` - для линий
- Добавлены новые методы: `addLevel1Annotation()`, `addLevel2Annotation()`, `addLine()`
- Заменен метод `createFinalGroup()` на `createFinalStructure()`

### 2. **Обновлена функция `createAnnotationLine`**
- Теперь использует метод `addLine()` вместо `insertChild()`

### 3. **Обновлена функция `setupMultiLevelGridLayout`**
- Аннотации колонок теперь добавляются через `addLevel1Annotation()`
- Аннотации групп теперь добавляются через `addLevel2Annotation()`
- Финальная структура создается через `createFinalStructure(columnDirection, annotationSpacing)`

### 4. **Обновлена функция `setupSimpleGridLayout`**
- Также использует новый метод `createFinalStructure()`

## Итоговая структура аннотаций:

### Для горизонтального макета:
```
"ComponentSet annotations"
├── Auto Layout: vertical, gap: 24px
    ├── Level 2
    │   ├── annotation-group-[название]
    │   ├── Vector (линия)
    │   └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

### Для вертикального макета:
```
"ComponentSet annotations"
├── Auto Layout: horizontal, gap: 24px
    ├── Level 2
    │   ├── annotation-group-[название]
    │   ├── Vector (линия)
    │   └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

Теперь:
- ✅ Каждый уровень аннотаций в собственном Folder
- ✅ Общий folder с Auto Layout и Gap равным значению "Отступ между уровнями аннотаций"
- ✅ Структура создается в самом конце, не ломая процесс создания
- ✅ Аннотации колонок больше не дублируются между группами
- ✅ Аннотации групп не дублируются

Структура будет создана правильно с нужными Auto Layout настройками!

```plaintext
"ComponentSet annotations"
├── Auto Layout: vertical, gap: 24px
    ├── Level 2
    │   ├── annotation-group-[название]
    │   ├── Vector (линия)
    │   └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

```plaintext
"ComponentSet annotations"
├── Auto Layout: horizontal, gap: 24px
    ├── Level 2
    │   ├── annotation-group-[название]
    │   ├── Vector (линия)
    │   └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

---

**User**


vendor-core-954a4d5e11f815a0.min.js.br:23 TypeError: Cannot add property layoutMode, object is not extensible
    at Object.createFinalStructure (PLUGIN_455_SOURCE:154:31)
    at Object.eval (PLUGIN_455_SOURCE:702:25)
    at er.callFunction (2591-c5605cda66a34630.min.js.br:1406:5094)
    at callback (2591-c5605cda66a34630.min.js.br:1406:9432)
    at 2591-c5605cda66a34630.min.js.br:1406:9729
    at t (vendor-core-954a4d5e11f815a0.min.js.br:23:3695)

---

**Cursor**

Вижу проблему! Ошибка происходит потому, что я пытаюсь применить `layoutMode` к группе, но группы в Figma не поддерживают Auto Layout. Для Auto Layout нужно использовать `figma.createFrame()`.

Давайте исправим функцию `createFinalStructure`:

```javascript
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
```

Отлично! Теперь проблема должна быть решена. Я исправил основную ошибку:

## Что было исправлено:

### Проблема:
- Пытался применить `layoutMode` к группе (`figma.group()`), но группы в Figma не поддерживают Auto Layout
- Это вызывало ошибку "Cannot add property layoutMode, object is not extensible"

### Решение:
- Заменил `figma.group()` на `figma.createFrame()` для главного контейнера
- Frame поддерживает Auto Layout
- Добавил правильную настройку всех свойств Auto Layout

### Новая логика создания структуры:

1. **Создается Frame** вместо группы для главного контейнера
2. **Настраивается Auto Layout** с правильными параметрами:
   - `layoutMode`: 'VERTICAL' для горизонтального макета, 'HORIZONTAL' для вертикального
   - `itemSpacing`: равен значению `annotationSpacing` (24px по умолчанию)
   - `primaryAxisAlignItems`: 'MIN' (выравнивание по началу)
   - `counterAxisAlignItems`: 'MIN' (выравнивание по началу)
   - `primaryAxisSizingMode`: 'AUTO' (размер по содержимому)
   - `counterAxisSizingMode`: 'AUTO' (размер по содержимому)
3. **Убираются визуальные эффекты**: фон и границы, чтобы Frame был невидимым контейнером
4. **Элементы добавляются в Frame** в правильном порядке

### Итоговая структура:
```
"ComponentSet annotations" (Frame с Auto Layout)
├── Level 2 (Group)
│   ├── annotation-group-[название]
│   ├── Vector (линия)
│   └── ...
└── Level 1 (Group)
    ├── annotation-column-[название]
    ├── annotation-column-[название]
    └── ...
```

Теперь плагин должен работать без ошибок и создавать правильную структуру с Auto Layout!

```plaintext
"ComponentSet annotations" (Frame с Auto Layout)
├── Level 2 (Group)
│   ├── annotation-group-[название]
│   ├── Vector (линия)
│   └── ...
└── Level 1 (Group)
    ├── annotation-column-[название]
    ├── annotation-column-[название]
    └── ...
```

---

**User**

Сейчас автолейаут с аннотациями не совсем верно располагается:

При направлении колонок внутри групп «По вертикали»...
- сейчас левый верхний угол групп аннотаций имеет такие же координаты, как и левый верхний угол компонента

Нужно чтобы при:
- Отступ между уровнями аннотаций (px): 0 
- Паддинг (px):0 

...правый верхний угол автолейаута с аннотациями имел такие же координаты, как и левый верхний угол компонента
при Отступ между уровнями аннотаций (px) больше нуля — вычитаем это значение из x
при Паддинг (px) — прибовляем это значение к y

--

При направлении колонок внутри групп «По вертикали»:
- сейчас левый верхний угол групп аннотаций имеет такие же координаты, как и левый верхний угол компонента

Нужно чтобы при:
- Отступ между уровнями аннотаций (px): 0 
- Паддинг (px):0 

...нижний левый угол автолейаута с аннотациями имел такие же координаты, как и левый верхний угол компонента
при Отступ между уровнями аннотаций (px) больше нуля — вычитаем это значение из y
при Паддинг (px) — прибавляем это значение к x

---

**Cursor**

Понимаю! Нужно правильно позиционировать Frame с аннотациями относительно ComponentSet. Давайте исправим функцию `createFinalStructure`, добавив правильное позиционирование:

```javascript
    // Метод для создания финальной структуры папок из всех аннотаций
    createFinalStructure: function(columnDirection, annotationSpacing = 24, componentSet = null, padding = 0) {
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
        
        // Позиционируем Frame относительно ComponentSet
        if (componentSet) {
          if (columnDirection === 'horizontal') {
            // При горизонтальном направлении: нижний левый угол аннотаций = левый верхний угол компонента
            mainFrame.x = componentSet.x + padding; // прибавляем padding к x
            mainFrame.y = componentSet.y - mainFrame.height - annotationSpacing; // вычитаем annotationSpacing из y
          } else {
            // При вертикальном направлении: правый верхний угол аннотаций = левый верхний угол компонента  
            mainFrame.x = componentSet.x - mainFrame.width - annotationSpacing; // вычитаем annotationSpacing из x
            mainFrame.y = componentSet.y + padding; // прибавляем padding к y
          }
        }
        
        return mainFrame;
      }
      
      return null;
    }
```

Отлично! Теперь позиционирование аннотаций должно работать правильно. Давайте резюмируем изменения:

## Что было исправлено:

### 1. **Добавлены новые параметры в `createFinalStructure`**:
- `componentSet` - для получения координат ComponentSet
- `padding` - для учета отступов

### 2. **Добавлена логика позиционирования Frame**:

**Для горизонтального направления колонок (`columnDirection === 'horizontal'`):**
- Аннотации располагаются **СВЕРХУ** от ComponentSet
- `x = componentSet.x + padding` (прибавляем padding к x)
- `y = componentSet.y - frameHeight - annotationSpacing` (вычитаем annotationSpacing из y)
- **Результат**: нижний левый угол аннотаций = левый верхний угол ComponentSet

**Для вертикального направления колонок (`columnDirection === 'vertical'`):**
- Аннотации располагаются **СЛЕВА** от ComponentSet
- `x = componentSet.x - frameWidth - annotationSpacing` (вычитаем annotationSpacing из x)
- `y = componentSet.y + padding` (прибавляем padding к y)
- **Результат**: правый верхний угол аннотаций = левый верхний угол ComponentSet

### 3. **Обновлены вызовы функции**:
- В `setupMultiLevelGridLayout` и `setupSimpleGridLayout` теперь передаются `componentSet` и `padding`

## Проверим логику:

**При `annotationSpacing = 0` и `padding = 0`:**
- Горизонтальный: аннотации точно над ComponentSet
- Вертикальный: аннотации точно слева от ComponentSet

**При `annotationSpacing > 0`:**
- Создается дополнительный отступ между аннотациями и ComponentSet

**При `padding > 0`:**
- Аннотации сдвигаются вправо (горизонтальный) или вниз (вертикальный)

Теперь позиционирование аннотаций должно работать точно по вашим требованиям!

---

**User**

- Сейчас при «Направление колонок внутри групп: По горизонтали» есть не только колонки внутри групп, но строки внутри групп.
- Для каждой строки нужно показывать тоже аннотацию. 
- Получается, будет две группы аннотаций — по горизонтали основная и по вертикали слева дополнительная.

Похожим образом и для  «Направление колонок внутри групп: По вертиикали» 

---

**Cursor**

Понимаю! Нужно добавить аннотации для строк внутри групп. Получается двухуровневая система аннотаций:

1. **Основные аннотации** (группы + колонки)
2. **Дополнительные аннотации** (строки)

Давайте сначала обновим структуру для поддержки двух групп аннотаций:

```javascript
// Функция для создания папки аннотаций
function createAnnotationsFolder(componentSet) {
  const parentNode = componentSet.parent;
  if (!parentNode) return null;
  
  const annotationsFolderName = `${componentSet.name} annotations`;
  
  // Создаем контейнер для сбора аннотаций по уровням
  const annotationsContainer = {
    name: annotationsFolderName,
    parent: parentNode,
    // Основные аннотации
    level1Annotations: [], // колонки
    level2Annotations: [], // группы
    lines: [], // линии
    // Дополнительные аннотации
    rowAnnotations: [], // строки
    rowLines: [], // линии для строк
    
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
    
    addRowAnnotation: function(annotation) {
      this.rowAnnotations.push(annotation);
      this.parent.appendChild(annotation);
    },
    
    addRowLine: function(line) {
      this.rowLines.push(line);
      this.parent.appendChild(line);
    },
    
    // Метод для создания финальной структуры папок из всех аннотаций
    createFinalStructure: function(columnDirection, annotationSpacing = 24, componentSet = null, padding = 0) {
      const mainAnnotations = this.level1Annotations.length > 0 || this.level2Annotations.length > 0;
      const rowAnnotations = this.rowAnnotations.length > 0;
      
      if (!mainAnnotations && !rowAnnotations) {
        return null;
      }
      
      const createdFrames = [];
      
      // Создаем основную группу аннотаций (группы + колонки)
      if (mainAnnotations) {
        const mainFrame = this.createMainAnnotationsFrame(columnDirection, annotationSpacing, componentSet, padding);
        if (mainFrame) {
          createdFrames.push(mainFrame);
        }
      }
      
      // Создаем дополнительную группу аннотаций (строки)
      if (rowAnnotations) {
        const rowFrame = this.createRowAnnotationsFrame(columnDirection, annotationSpacing, componentSet, padding);
        if (rowFrame) {
          createdFrames.push(rowFrame);
        }
      }
      
      return createdFrames;
    },
    
    // Создание основной группы аннотаций
    createMainAnnotationsFrame: function(columnDirection, annotationSpacing, componentSet, padding) {
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
      
      if (allElements.length === 0) return null;
      
      // Создаем общий Frame с Auto Layout
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
      
      // Позиционируем Frame относительно ComponentSet
      if (componentSet) {
        if (columnDirection === 'horizontal') {
          // При горизонтальном направлении: нижний левый угол аннотаций = левый верхний угол компонента
          mainFrame.x = componentSet.x + padding; // прибавляем padding к x
          mainFrame.y = componentSet.y - mainFrame.height - annotationSpacing; // вычитаем annotationSpacing из y
        } else {
          // При вертикальном направлении: правый верхний угол аннотаций = левый верхний угол компонента  
          mainFrame.x = componentSet.x - mainFrame.width - annotationSpacing; // вычитаем annotationSpacing из x
          mainFrame.y = componentSet.y + padding; // прибавляем padding к y
        }
      }
      
      return mainFrame;
    },
    
    // Создание дополнительной группы аннотаций (для строк)
    createRowAnnotationsFrame: function(columnDirection, annotationSpacing, componentSet, padding) {
      if (this.rowAnnotations.length === 0) return null;
      
      const allElements = [];
      
      // Создаем папку для строк
      const rowFolder = figma.group(this.rowAnnotations.concat(this.rowLines), this.parent);
      rowFolder.name = 'Rows';
      allElements.push(rowFolder);
      
      // Создаем общий Frame с Auto Layout
      const rowFrame = figma.createFrame();
      rowFrame.name = `${this.name} Rows`;
      rowFrame.fills = []; // Убираем фон
      rowFrame.strokes = []; // Убираем границы
      rowFrame.clipsContent = false;
      
      // Настраиваем Auto Layout (перпендикулярно основному направлению)
      rowFrame.layoutMode = columnDirection === 'horizontal' ? 'HORIZONTAL' : 'VERTICAL';
      rowFrame.itemSpacing = annotationSpacing;
      rowFrame.primaryAxisAlignItems = 'MIN';
      rowFrame.counterAxisAlignItems = 'MIN';
      rowFrame.primaryAxisSizingMode = 'AUTO';
      rowFrame.counterAxisSizingMode = 'AUTO';
      
      // Добавляем Frame в родительский узел
      this.parent.appendChild(rowFrame);
      
      // Перемещаем все элементы в Frame
      allElements.forEach(element => {
        rowFrame.appendChild(element);
      });
      
      // Позиционируем Frame относительно ComponentSet
      if (componentSet) {
        if (columnDirection === 'horizontal') {
          // При горизонтальном направлении: аннотации строк слева
          rowFrame.x = componentSet.x - rowFrame.width - annotationSpacing; // вычитаем annotationSpacing из x
          rowFrame.y = componentSet.y + padding; // прибавляем padding к y
        } else {
          // При вертикальном направлении: аннотации строк сверху
          rowFrame.x = componentSet.x + padding; // прибавляем padding к x
          rowFrame.y = componentSet.y - rowFrame.height - annotationSpacing; // вычитаем annotationSpacing из y
        }
      }
      
      return rowFrame;
    }
  };
  
  return annotationsContainer;
}
```

```plaintext
groups = {
  "groupKey": {
    "columnKey": [variants]
  }
}
```

Теперь нужно добавить логику для создания аннотаций строк. Давайте обновим функцию `setupMultiLevelGridLayout`:

Теперь добавлю логику для создания аннотаций строк в функции `setupMultiLevelGridLayout`. Сначала нужно определить, что такое "строки" в каждом направлении:

```javascript
  // Позиционируем компоненты
  let currentRowY = padding;
  const annotationOffset = 15; // Отступ для аннотаций
  
  // Набор для отслеживания созданных аннотаций строк
  const createdRowAnnotations = new Set();
  
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
            
            // Создаем аннотацию для строки (если включены аннотации)
            if (showAnnotations && annotationsFolder) {
              const rowY = currentRowY + itemIndex * (maxHeight + spacing);
              const rowKey = `row-${rowY}`;
              
              if (!createdRowAnnotations.has(rowKey)) {
                // Получаем название строки из варианта (все свойства кроме свойств группировки и колонок)
                let rowName = '';
                if (variant.variantProperties) {
                  const excludeProps = [...groupProperties];
                  if (columnProperty) excludeProps.push(columnProperty);
                  
                  const rowProps = Object.keys(variant.variantProperties)
                    .filter(prop => !excludeProps.includes(prop))
                    .sort()
                    .map(prop => `${prop}:${variant.variantProperties[prop]}`)
                    .join('|');
                  
                  rowName = rowProps || `Row ${itemIndex + 1}`;
                }
                
                if (rowName && rowName !== '') {
                  // Позиция аннотации строки слева от ComponentSet
                  const rowAnnotationWidth = 116;
                  const rowAnnotationX = componentSetX - annotationSpacing - rowAnnotationWidth;
                  
                  createGroupAnnotation(
                    rowName,
                    rowAnnotationX,
                    rowY + maxHeight / 2 - 12 // Центрируем по высоте варианта
                  ).then(annotation => {
                    annotation.name = `annotation-row-${rowName}`;
                    annotationsFolder.addRowAnnotation(annotation);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }
              }
            }
          });
        });
        
        // ... existing code for group annotations ...
        
      } else {
        // Вертикальное расположение колонок - аннотации слева
        let currentColumnY = currentRowY;
        const groupStartY = currentColumnY;
        
        // ... existing code ...
        
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
            
            // Создаем аннотацию для строки (если включены аннотации)
            if (showAnnotations && annotationsFolder) {
              const rowX = currentGroupX;
              const rowKey = `row-${rowX}`;
              
              if (!createdRowAnnotations.has(rowKey)) {
                // Получаем название строки из варианта (все свойства кроме свойств группировки и колонок)
                let rowName = '';
                if (variant.variantProperties) {
                  const excludeProps = [...groupProperties];
                  if (columnProperty) excludeProps.push(columnProperty);
                  
                  const rowProps = Object.keys(variant.variantProperties)
                    .filter(prop => !excludeProps.includes(prop))
                    .sort()
                    .map(prop => `${prop}:${variant.variantProperties[prop]}`)
                    .join('|');
                  
                  rowName = rowProps || `Row ${itemIndex + 1}`;
                }
                
                if (rowName && rowName !== '') {
                  // Позиция аннотации строки сверху от ComponentSet
                  const rowAnnotationHeight = 25;
                  const rowAnnotationY = componentSetY - annotationSpacing - rowAnnotationHeight;
                  
                  createGroupAnnotation(
                    rowName,
                    rowX + maxWidth / 2 - 50, // Центрируем по ширине варианта
                    rowAnnotationY
                  ).then(annotation => {
                    annotation.name = `annotation-row-${rowName}`;
                    annotationsFolder.addRowAnnotation(annotation);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }
              }
            }
          });
          
          // ... existing code ...
        });
        
        groupWidth = maxWidth;
      }
```

Теперь нужно добавить недостающую часть кода для групп в горизонтальном направлении и создать функцию для линий строк:

```javascript
          });
        });
        
        // ... existing code for group annotations ...

->

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
```

Давайте проверим структуру кода и убедимся, что все части на месте:

Нужно обновить параметры функции `setupMultiLevelGridLayout`, чтобы передавать `groupProperties`:

```javascript
function setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing = 24) {

->

function setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing = 24, groupProperties = [], columnProperty = null) {
```

```javascript
      setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing);

->

      setupMultiLevelGridLayout(componentSet, groups, padding, spacing, columnSpacing, groupSpacing, groupsPerRow, columnDirection, showAnnotations, annotationSpacing, groupProperties, columnProperty);
```

Отлично! Теперь система аннотаций с поддержкой строк готова. Давайте резюмируем что было реализовано:

## ✅ Что реализовано:

### 1. **Двухуровневая система аннотаций**
- **Основные аннотации**: группы + колонки (в одном Frame)
- **Дополнительные аннотации**: строки (в отдельном Frame)

### 2. **Логика определения строк**

**Для горизонтального направления** (`columnDirection === 'horizontal'`):
- Варианты в колонках располагаются вертикально друг под другом
- Каждый вариант на определенной Y-позиции = отдельная строка
- **Аннотации строк** располагаются **слева** от ComponentSet
- **Название строки** = свойства варианта (кроме группирующих и колоночных свойств)

**Для вертикального направления** (`columnDirection === 'vertical'`):
- Колонки располагаются одна под другой
- Варианты на одной X-позиции = строка  
- **Аннотации строк** располагаются **сверху** от ComponentSet
- **Название строки** = свойства варианта (кроме группирующих и колоночных свойств)

### 3. **Структура итоговых аннотаций**

**При горизонтальном направлении**:
```
ComponentSet annotations (Frame)        ComponentSet annotations Rows (Frame)
├── Auto Layout: vertical, gap: 24px    ├── Auto Layout: horizontal, gap: 24px
    ├── Level 2                             └── Rows
    │   ├── annotation-group-[название]         ├── annotation-row-[свойства]
    │   ├── Vector (линия)                      ├── annotation-row-[свойства]
    │   └── ...                                 └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

**При вертикальном направлении**:
```
ComponentSet annotations (Frame)        ComponentSet annotations Rows (Frame)
├── Auto Layout: horizontal, gap: 24px  ├── Auto Layout: vertical, gap: 24px
    ├── Level 2                             └── Rows
    │   ├── annotation-group-[название]         ├── annotation-row-[свойства]
    │   ├── Vector (линия)                      ├── annotation-row-[свойства]
    │   └── ...                                 └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

### 4. **Позиционирование**

**Горизонтальное направление**:
- **Основные аннотации**: сверху от ComponentSet
- **Строки**: слева от ComponentSet

**Вертикальное направление**:
- **Основные аннотации**: слева от ComponentSet  
- **Строки**: сверху от ComponentSet

### 5. **Предотвращение дублирования**
- ✅ Группы: отслеживаются по названию
- ✅ Колонки: отслеживаются по позиции
- ✅ Строки: отслеживаются по позиции

Теперь у вас есть полная двухуровневая система аннотаций, где каждый компонент будет помечен:
- По группе (если есть группировка)
- По колонке (если есть колоночное свойство)
- По строке (остальные свойства)

Это даст полное понимание структуры компонентов!

```plaintext
ComponentSet annotations (Frame)        ComponentSet annotations Rows (Frame)
├── Auto Layout: vertical, gap: 24px    ├── Auto Layout: horizontal, gap: 24px
    ├── Level 2                             └── Rows
    │   ├── annotation-group-[название]         ├── annotation-row-[свойства]
    │   ├── Vector (линия)                      ├── annotation-row-[свойства]
    │   └── ...                                 └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

```plaintext
ComponentSet annotations (Frame)        ComponentSet annotations Rows (Frame)
├── Auto Layout: horizontal, gap: 24px  ├── Auto Layout: vertical, gap: 24px
    ├── Level 2                             └── Rows
    │   ├── annotation-group-[название]         ├── annotation-row-[свойства]
    │   ├── Vector (линия)                      ├── annotation-row-[свойства]
    │   └── ...                                 └── ...
    └── Level 1
        ├── annotation-column-[название]
        ├── annotation-column-[название]
        └── ...
```

---

**User**

Все отлично!

Но есть небольшой баг:
- при повоторном нажатии на кнопку «Выровнять» в плагине — новые дополнительные аннотации создаются поверх существующих и старые не исчезают
- с основными аннотациями такой проблемы нет

---

**Cursor**

Понял проблему! Давайте исправим этот баг. Нужно посмотреть, как происходит удаление существующих аннотаций и почему row annotations не удаляются.

```javascript
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
```

```javascript
rowFrame.name = `${this.name} Rows`;
```

Вижу проблему! В коде есть логика удаления старых аннотаций, но она ищет только папку с именем `${componentSet.name} annotations`, а дополнительные аннотации (row annotations) создаются в папке с именем `${componentSet.name} annotations Rows`. Поэтому row annotations не удаляются при повторном запуске.

Нужно исправить логику удаления, чтобы она удаляла все папки аннотаций:

```javascript
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

->

    // Удаляем существующие папки аннотаций (всегда, чтобы можно было убрать их при выключении опции)
    const parentNode = componentSet.parent;
    const annotationsFolderName = `${componentSet.name} annotations`;
    if (parentNode) {
      // Ищем и удаляем все папки, которые начинаются с названия аннотаций
      const annotationFolders = parentNode.children.filter(child => 
        child.name === annotationsFolderName || child.name.startsWith(annotationsFolderName + ' '));
      annotationFolders.forEach(folder => {
        folder.remove();
      });
    }
```

Проблема исправлена! Теперь при повторном нажатии кнопки "Выровнять" код будет правильно удалять все старые аннотации (и основные, и дополнительные row annotations) перед созданием новых.

**Что было исправлено:**
- Логика удаления теперь ищет все папки, которые начинаются с `${componentSet.name} annotations`
- Это покрывает как основную папку `${componentSet.name} annotations`, так и дополнительную папку `${componentSet.name} annotations Rows`
- Используется `filter()` вместо `find()` для поиска всех соответствующих папок
- Все найденные папки удаляются в цикле `forEach()`

Теперь при повторном запуске плагина дублирование аннотаций больше не будет происходить!

---

**User**

Оберни каждую annotation-column в ещё один auto-layout, ширина этого слоя (или высота при вертикальном) должна быть равна ширине колонки

---

**Cursor**

Понял! Нужно обернуть каждую аннотацию колонки в дополнительный Auto Layout контейнер с правильными размерами. Давайте найдем, где создаются аннотации колонок и добавим эту логику.

```javascript
createGroupAnnotation(
  columnKey, 
  columnX, 
  level2Y // Позиционируем на среднем уровне (уровень 2)
).then(annotation => {
  annotation.name = `annotation-column-${columnKey}`;
  annotationsFolder.addLevel1Annotation(annotation);
});
```

```javascript
createGroupAnnotation(
  columnKey,
  level2X, // Позиционируем на среднем уровне (уровень 2)
  currentColumnY + 5
).then(annotation => {
  annotation.name = `annotation-column-${columnKey}`;
  annotationsFolder.addLevel1Annotation(annotation);
});
```

```javascript
createGroupAnnotation(
  columnKey,
  level2X, // Позиционируем на среднем уровне (уровень 2)
  currentColumnY + 5
).then(annotation => {
  annotation.name = `annotation-column-${columnKey}`;
  annotationsFolder.addLevel1Annotation(annotation);
});
```

Отлично! Теперь я понимаю структуру. Нужно создать функцию, которая будет оборачивать аннотации колонок в Auto Layout контейнер с правильными размерами. Давайте добавим эту функцию и обновим места создания аннотаций колонок.

```javascript
// Функция для многоуровневой группировки вариантов
function createMultiLevelGroups(variants, groupProperties, columnProperty) {

->

// Функция для создания обернутой аннотации колонки
async function createWrappedColumnAnnotation(text, x, y, columnDirection, columnWidth, columnHeight) {
  // Создаем аннотацию
  const annotation = await createGroupAnnotation(text, 0, 0); // Позиционируем относительно контейнера
  annotation.name = `annotation-column-${text}`;
  
  // Создаем контейнер с Auto Layout
  const container = figma.createFrame();
  container.name = `Column Wrapper: ${text}`;
  container.fills = []; // Прозрачный фон
  container.strokes = []; // Без границ
  container.clipsContent = false;
  
  // Настраиваем Auto Layout в зависимости от направления
  if (columnDirection === 'horizontal') {
    // Горизонтальное направление: контейнер должен быть шириной как колонка
    container.layoutMode = 'HORIZONTAL';
    container.primaryAxisAlignItems = 'CENTER'; // Центрируем по горизонтали
    container.counterAxisAlignItems = 'MIN'; // Выравниваем по верху
    container.primaryAxisSizingMode = 'FIXED'; // Фиксированная ширина
    container.counterAxisSizingMode = 'AUTO'; // Высота по содержимому
    container.resize(columnWidth, 50); // Временная высота, Auto Layout подстроит
  } else {
    // Вертикальное направление: контейнер должен быть высотой как колонка
    container.layoutMode = 'VERTICAL';
    container.primaryAxisAlignItems = 'CENTER'; // Центрируем по вертикали
    container.counterAxisAlignItems = 'MIN'; // Выравниваем по левому краю
    container.primaryAxisSizingMode = 'FIXED'; // Фиксированная высота
    container.counterAxisSizingMode = 'AUTO'; // Ширина по содержимому
    container.resize(200, columnHeight); // Временная ширина, Auto Layout подстроит
  }
  
  // Добавляем аннотацию в контейнер
  container.appendChild(annotation);
  
  // Позиционируем контейнер
  container.x = x;
  container.y = y;
  
  return container;
}

// Функция для многоуровневой группировки вариантов
function createMultiLevelGroups(variants, groupProperties, columnProperty) {
```

```javascript
createGroupAnnotation(
  columnKey, 
  columnX, 
  level2Y // Позиционируем на среднем уровне (уровень 2)
).then(annotation => {
  annotation.name = `annotation-column-${columnKey}`;
  annotationsFolder.addLevel1Annotation(annotation);
});
```

```javascript
createGroupAnnotation(
  columnKey,
  level2X, // Позиционируем на среднем уровне (уровень 2)
  currentColumnY + 5
).then(annotation => {
  annotation.name = `annotation-column-${columnKey}`;
  annotationsFolder.addLevel1Annotation(annotation);
});
```

Теперь давайте заменим создание аннотаций колонок на использование новой функции с Auto Layout. Начнем с горизонтального направления:

```javascript
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

->

          // Создаем аннотацию для колонки сверху (если включены аннотации, есть название колонки и она еще не создана в этой позиции)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-pos-${columnX}`)) {
            // Рассчитываем позицию уровня 2 с правильными отступами 24px
            const variantAnnotationHeight = 25; // примерная высота рамки (hug content адаптируется)
            const columnAnnotationHeight = 25;
            const level3Y = componentSetY - annotationSpacing - variantAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации варианта
            const level2Y = level3Y - annotationSpacing - columnAnnotationHeight; // позиция ВЕРХНЕЙ границы аннотации колонки
            
            // Создаем обернутую аннотацию с шириной колонки
            createWrappedColumnAnnotation(
              columnKey,
              columnX,
              level2Y,
              columnDirection,
              maxWidth, // ширина колонки
              0 // высота не важна для горизонтального направления
            ).then(wrapper => {
              annotationsFolder.addLevel1Annotation(wrapper);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${columnX}`);
          }
```

```javascript
const columnHeight = columnVariants.length * maxHeight + (columnVariants.length - 1) * spacing;
```

Теперь давайте заменим создание аннотаций для вертикального направления:

```javascript
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

->

          // Создаем аннотацию для колонки слева (если включены аннотации, есть название колонки и она еще не создана в этой позиции)
          if (showAnnotations && columnKey !== 'default' && annotationsFolder && !createdAnnotations.has(`column-pos-${currentColumnY}`)) {
            // Рассчитываем позицию уровня 2 с правильными отступами 24px
            const variantAnnotationWidth = 116; // примерная ширина рамки (hug content адаптируется)
            const columnAnnotationWidth = 116;
            const level3X = componentSetX - annotationSpacing - variantAnnotationWidth; // позиция ЛЕВОЙ границы аннотации варианта
            const level2X = level3X - annotationSpacing - columnAnnotationWidth; // позиция ЛЕВОЙ границы аннотации колонки
            
            // Рассчитываем высоту колонки
            const columnHeight = columnVariants.length * maxHeight + (columnVariants.length - 1) * spacing;
            
            // Создаем обернутую аннотацию с высотой колонки
            createWrappedColumnAnnotation(
              columnKey,
              level2X,
              currentColumnY,
              columnDirection,
              0, // ширина не важна для вертикального направления
              columnHeight // высота колонки
            ).then(wrapper => {
              annotationsFolder.addLevel1Annotation(wrapper);
            });
            
            // Отмечаем, что аннотация для этой позиции уже создана
            createdAnnotations.add(`column-pos-${currentColumnY}`);
          }
```

Отлично! Теперь каждая аннотация колонки обернута в Auto Layout контейнер с правильными размерами:

## Что было реализовано:

1. **Создана новая функция `createWrappedColumnAnnotation`**, которая:
   - Создает аннотацию с помощью существующей функции `createGroupAnnotation`
   - Оборачивает ее в Frame с Auto Layout
   - Настраивает размеры и выравнивание в зависимости от направления

2. **Для горизонтального направления:**
   - Ширина контейнера = ширине колонки (`maxWidth`)
   - Auto Layout = `HORIZONTAL` с центрированием по горизонтали
   - Высота подстраивается под содержимое

3. **Для вертикального направления:**
   - Высота контейнера = высоте колонки (`columnVariants.length * maxHeight + (columnVariants.length - 1) * spacing`)
   - Auto Layout = `VERTICAL` с центрированием по вертикали
   - Ширина подстраивается под содержимое

4. **Заменены вызовы создания аннотаций** в обоих местах:
   - Горизонтальное направление: передается `maxWidth` как ширина колонки
   - Вертикальное направление: рассчитывается и передается реальная высота колонки

Теперь каждая annotation-column будет располагаться в контейнере, размер которого точно соответствует размеру колонки, и аннотация будет центрирована внутри этого контейнера!

---

**User**

Давай сделаем тоже самое для annotation-row

---

**Cursor**

Понял! Давайте создадим аналогичную функцию для annotation-row и заменим создание аннотаций строк. Сначала найдем, где они создаются.

Отлично! Теперь создам функцию для обертывания аннотаций строк и заменю их создание. Сначала добавлю функцию:

```javascript
  return container;
}

// Функция для многоуровневой группировки вариантов

->

  return container;
}

// Функция для создания обернутой аннотации строки
async function createWrappedRowAnnotation(text, x, y, columnDirection, rowWidth, rowHeight) {
  // Создаем аннотацию
  const annotation = await createGroupAnnotation(text, 0, 0); // Позиционируем относительно контейнера
  annotation.name = `annotation-row-${text}`;
  
  // Создаем контейнер с Auto Layout
  const container = figma.createFrame();
  container.name = `Row Wrapper: ${text}`;
  container.fills = []; // Прозрачный фон
  container.strokes = []; // Без границ
  container.clipsContent = false;
  
  // Настраиваем Auto Layout в зависимости от направления
  if (columnDirection === 'horizontal') {
    // Горизонтальное направление: контейнер должен быть высотой как строка (вариант)
    container.layoutMode = 'VERTICAL';
    container.primaryAxisAlignItems = 'CENTER'; // Центрируем по вертикали
    container.counterAxisAlignItems = 'MIN'; // Выравниваем по левому краю
    container.primaryAxisSizingMode = 'FIXED'; // Фиксированная высота
    container.counterAxisSizingMode = 'AUTO'; // Ширина по содержимому
    container.resize(200, rowHeight); // Временная ширина, Auto Layout подстроит
  } else {
    // Вертикальное направление: контейнер должен быть шириной как строка (вариант)
    container.layoutMode = 'HORIZONTAL';
    container.primaryAxisAlignItems = 'CENTER'; // Центрируем по горизонтали
    container.counterAxisAlignItems = 'MIN'; // Выравниваем по верху
    container.primaryAxisSizingMode = 'FIXED'; // Фиксированная ширина
    container.counterAxisSizingMode = 'AUTO'; // Высота по содержимому
    container.resize(rowWidth, 50); // Временная высота, Auto Layout подстроит
  }
  
  // Добавляем аннотацию в контейнер
  container.appendChild(annotation);
  
  // Позиционируем контейнер
  container.x = x;
  container.y = y;
  
  return container;
}

// Функция для многоуровневой группировки вариантов
```

Теперь заменим создание аннотаций строк на использование новой функции. Начнем с горизонтального направления:

```javascript
                if (rowName && rowName !== '') {
                  // Позиция аннотации строки слева от ComponentSet
                  const rowAnnotationWidth = 116;
                  const rowAnnotationX = componentSetX - annotationSpacing - rowAnnotationWidth;
                  
                  createGroupAnnotation(
                    rowName,
                    rowAnnotationX,
                    rowY + maxHeight / 2 - 12 // Центрируем по высоте варианта
                  ).then(annotation => {
                    annotation.name = `annotation-row-${rowName}`;
                    annotationsFolder.addRowAnnotation(annotation);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }

->

                if (rowName && rowName !== '') {
                  // Позиция аннотации строки слева от ComponentSet
                  const rowAnnotationWidth = 116;
                  const rowAnnotationX = componentSetX - annotationSpacing - rowAnnotationWidth;
                  
                  // Создаем обернутую аннотацию с высотой строки (варианта)
                  createWrappedRowAnnotation(
                    rowName,
                    rowAnnotationX,
                    rowY, // Позиционируем контейнер по верхнему краю варианта
                    columnDirection,
                    0, // ширина не важна для горизонтального направления
                    maxHeight // высота строки (варианта)
                  ).then(wrapper => {
                    annotationsFolder.addRowAnnotation(wrapper);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }
```

Теперь заменим создание аннотаций строк для вертикального направления:

```javascript
                if (rowName && rowName !== '') {
                  // Позиция аннотации строки сверху от ComponentSet
                  const rowAnnotationHeight = 25;
                  const rowAnnotationY = componentSetY - annotationSpacing - rowAnnotationHeight;
                  
                  createGroupAnnotation(
                    rowName,
                    rowX + maxWidth / 2 - 50, // Центрируем по ширине варианта
                    rowAnnotationY
                  ).then(annotation => {
                    annotation.name = `annotation-row-${rowName}`;
                    annotationsFolder.addRowAnnotation(annotation);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }

->

                if (rowName && rowName !== '') {
                  // Позиция аннотации строки сверху от ComponentSet
                  const rowAnnotationHeight = 25;
                  const rowAnnotationY = componentSetY - annotationSpacing - rowAnnotationHeight;
                  
                  // Создаем обернутую аннотацию с шириной строки (варианта)
                  createWrappedRowAnnotation(
                    rowName,
                    rowX, // Позиционируем контейнер по левому краю варианта
                    rowAnnotationY,
                    columnDirection,
                    maxWidth, // ширина строки (варианта)
                    0 // высота не важна для вертикального направления
                  ).then(wrapper => {
                    annotationsFolder.addRowAnnotation(wrapper);
                  });
                  
                  createdRowAnnotations.add(rowKey);
                }
```

Отлично! Теперь все аннотации строк также обернуты в Auto Layout контейнеры с правильными размерами.

## Что было реализовано для annotation-row:

1. **Создана новая функция `createWrappedRowAnnotation`**, которая:
   - Создает аннотацию с помощью существующей функции `createGroupAnnotation`
   - Оборачивает ее в Frame с Auto Layout
   - Настраивает размеры и выравнивание в зависимости от направления

2. **Для горизонтального направления:**
   - Высота контейнера = высоте строки (варианта) = `maxHeight`
   - Auto Layout = `VERTICAL` с центрированием по вертикали
   - Ширина подстраивается под содержимое
   - Аннотация центрируется внутри контейнера по высоте

3. **Для вертикального направления:**
   - Ширина контейнера = ширине строки (варианта) = `maxWidth`
   - Auto Layout = `HORIZONTAL` с центрированием по горизонтали
   - Высота подстраивается под содержимое
   - Аннотация центрируется внутри контейнера по ширине

4. **Заменены вызовы создания аннотаций** в обоих местах:
   - Горизонтальное направление: передается `maxHeight` как высота строки
   - Вертикальное направление: передается `maxWidth` как ширина строки

Теперь и annotation-column, и annotation-row обернуты в Auto Layout контейнеры с размерами, соответствующими размерам их колонок/строк, и аннотации центрируются внутри этих контейнеров!


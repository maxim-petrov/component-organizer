const fs = require('fs');
const path = require('path');

// Build script для объединения файлов плагина Figma
function buildPlugin() {
  try {
    console.log('Начинаем сборку плагина...');

    // Читаем содержимое presets.js
    const presetsPath = path.join(__dirname, 'presets.js');
    const presetsContent = fs.readFileSync(presetsPath, 'utf8');
    
    // Читаем содержимое code.js
    const codePath = path.join(__dirname, 'code.js');
    const codeContent = fs.readFileSync(codePath, 'utf8');

    // Извлекаем только нужные части из presets.js (без exports)
    const presetsOnlyContent = presetsContent
      .replace(/\/\/ Экспорт для использования в других файлах[\s\S]*$/, '') // Удаляем export блок
      .trim();

    // Заменяем весь блок объявления предустановок и их загрузки
    const builtCodeContent = codeContent.replace(
      /\/\/ Предустановки компонентов - загружаются из presets\.js[\s\S]*?\/\/ Инициализируем предустановки при загрузке плагина\nloadPresets\(\);/,
      `// Предустановки компонентов (загружены из presets.js при сборке)
${presetsOnlyContent}`
    );

    // Создаем папку dist если её нет
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir);
    }

    // Записываем объединенный файл
    const builtCodePath = path.join(distDir, 'code.js');
    fs.writeFileSync(builtCodePath, builtCodeContent);

    // Копируем остальные файлы в dist
    const filesToCopy = ['manifest.json', 'ui.html'];
    filesToCopy.forEach(filename => {
      const sourcePath = path.join(__dirname, filename);
      const destPath = path.join(distDir, filename);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Скопирован: ${filename}`);
      }
    });

    console.log('✅ Сборка завершена! Файлы находятся в папке dist/');
    console.log('📁 Используйте dist/manifest.json для загрузки плагина в Figma');

  } catch (error) {
    console.error('❌ Ошибка при сборке:', error.message);
    process.exit(1);
  }
}

// Функция для разработки - следит за изменениями файлов
function watchFiles() {
  console.log('👀 Отслеживание изменений файлов...');
  console.log('Нажмите Ctrl+C для остановки');

  const filesToWatch = ['presets.js', 'code.js', 'ui.html', 'manifest.json'];
  
  filesToWatch.forEach(filename => {
    const filepath = path.join(__dirname, filename);
    if (fs.existsSync(filepath)) {
      fs.watchFile(filepath, { interval: 1000 }, () => {
        console.log(`📝 Изменен файл: ${filename}`);
        buildPlugin();
      });
    }
  });

  // Первоначальная сборка
  buildPlugin();
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);

if (args.includes('--watch') || args.includes('-w')) {
  watchFiles();
} else {
  buildPlugin();
} 
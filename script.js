const input = document.getElementById('command-input');
const output = document.getElementById('output');
const promptPath = document.querySelector('.prompt');

// 1. Инициализация состояния терминала
let currentDir = '~';
let commandHistory = [];
let historyIndex = -1;

// 2. Виртуальная файловая система
const fileSystem = {
    '~': {
        files: {
            'README.md': 'Hi, I\'m Daxo, a low-level dev and security researcher.\nFocusing on OS design, reverse engineering, and automation tools.',
            'contacts.txt': 'Telegram: @daxo_dev\nGitHub: github.com/daxo-developer\nEmail: root@daxo.sh'
        },
        dirs: ['projects', 'tools']
    },
    '~/projects': {
        files: {
            'DaxoOS.md': 'Microkernel written in Rust.\n[Status]: Active. Achieved direct VGA memory access (0xb8000) and custom bootloader.',
            'kernel.c': '#include <stdio.h>\n\nvoid main() {\n    printf("Hello Daxo OS World!\\n");\n}'
        },
        dirs: []
    },
    '~/tools': {
        files: {
            'ValidatorPro.py': 'Python security tool for automated sensitive data leak scanning in public repositories.'
        },
        dirs: []
    }
};

// 3. Статические команды
const commands = {
    'help': 'Доступные команды:\n  ls           - список файлов и папок\n  cd [папка]   - перейти в папку (cd .. для возврата)\n  cat [файл]   - прочитать текстовый файл\n  neofetch     - информация о системе\n  whoami       - текущий пользователь\n  clear        - очистить экран\n  github       - открыть профиль GitHub\n  sudo / sudo su - запуск от суперпользователя',
    'whoami': 'visitor@daxo.sh'
};

// 4.Ссылки для редиректов
const redirects = {
    'github': 'https://github.com/daxo-developer',
    'sudo': 'https://www.youtube.com/watch?v=J---aiyznGQ', // Keyboard Cat
    'sudo su': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Rickroll
};

// 5. вывод типу неофетч
function getNeofetch() {
    return `<span style="color: #58a6ff">       /\       </span>    <span style="color: #58a6ff"><b>visitor@daxo.sh</b></span>
<span style="color: #58a6ff">      /  \      </span>    ---------------
<span style="color: #58a6ff">     /\   \     </span>    <b>OS:</b> Daxo OS v0.1.2-beta
<span style="color: #58a6ff">    /  \   \    </span>    <b>Kernel:</b> daxo-microkernel-x86_64
<span style="color: #58a6ff">   /____\   \   </span>    <b>Uptime:</b> 4 hours, 20 mins
<span style="color: #58a6ff">  /______\___\  </span>    <b>Shell:</b> dsh (daxo-shell)
<span style="color: #58a6ff">  \__________/  </span>    <b>Display:</b> VGA Text Mode (80x25)
                    <b>CPU:</b> AMD Ryzen 5 (Virtual)
                    <b>Memory:</b> 512MB / 16GB (Allocated)`;
}

//слушатель клавиатуры
input.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const rawInput = input.value;
        const cleanedInput = rawInput.trim();
        const args = cleanedInput.split(' ');
        const cmd = args[0].toLowerCase();
        
        if (cleanedInput !== '') {
            commandHistory.push(cleanedInput);
        }
        historyIndex = -1;

        //Выводим команду
        printLine(`<span class="prompt">visitor@daxo.sh:${currentDir}$</span> ${rawInput}`);

        if (cleanedInput === '') {
            // Пустой ввод
        } else if (redirects[cleanedInput.toLowerCase()]) {
            printLine('Redirecting...');
            setTimeout(() => { window.location.href = redirects[cleanedInput.toLowerCase()]; }, 500);
        } else if (cmd === 'clear') {
            output.innerHTML = '';
        } else if (cmd === 'neofetch') {
            printLine(getNeofetch());
        } else if (commands[cmd]) {
            printLine(commands[cmd]);
        } else if (cmd === 'ls') {
            executeLs();
        } else if (cmd === 'cd') {
            executeCd(args[1]);
        } else if (cmd === 'cat') {
            executeCat(args[1]);
        } else {
            printLine(`dsh: command not found: ${cmd}. Type 'help' for options.`);
        }

        input.value = '';
        window.scrollTo(0, document.body.scrollHeight);
    }

    // Логика стрелочек Вверх/Вниз (История)
    if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
            historyIndex++;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        }
    }
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (historyIndex > 0) {
            historyIndex--;
            input.value = commandHistory[commandHistory.length - 1 - historyIndex];
        } else if (historyIndex === 0) {
            historyIndex = -1;
            input.value = '';
        }
    }
});

// Реализация файловых команд
function executeLs() {
    const currentStructure = fileSystem[currentDir];
    let result = '';
    
    // Подсвечиваем папки синим цветом, файлы оставляем обычными
    currentStructure.dirs.forEach(d => {
        result += `<span style="color: #58a6ff; font-weight: bold;">${d}/</span>   `;
    });
    Object.keys(currentStructure.files).forEach(f => {
        result += `${f}   `;
    });
    
    printLine(result || 'Directory is empty');
}

function executeCd(targetDir) {
    if (!targetDir || targetDir === '~') {
        currentDir = '~';
        promptPath.innerHTML = `visitor@daxo.sh:${currentDir}$`;
        return;
    }

    if (targetDir === '..') {
        if (currentDir !== '~') {
            currentDir = '~'; // Из подпапки возвращаемся в корень
            promptPath.innerHTML = `visitor@daxo.sh:${currentDir}$`;
        }
        return;
    }

    const currentStructure = fileSystem[currentDir];
    if (currentStructure.dirs.includes(targetDir)) {
        currentDir = `${currentDir}/${targetDir}`;
        promptPath.innerHTML = `visitor@daxo.sh:${currentDir}$`;
    } else {
        printLine(`cd: no such file or directory: ${targetDir}`);
    }
}

function executeCat(targetFile) {
    if (!targetFile) {
        printLine('cat: missing file operand');
        return;
    }
    const currentStructure = fileSystem[currentDir];
    if (currentStructure.files[targetFile]) {
        printLine(currentStructure.files[targetFile]);
    } else if (currentStructure.dirs.includes(targetFile) || (targetFile.endsWith('/') && currentStructure.dirs.includes(targetFile.slice(0, -1)))) {
        printLine(`cat: ${targetFile}: Is a directory`);
    } else {
        printLine(`cat: ${targetFile}: No such file or directory`);
    }
}

function printLine(text) {
    const p = document.createElement('p');
    p.innerHTML = text;
    output.appendChild(p);
}

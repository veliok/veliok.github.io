/*
 * Copyright 2020 WebAssembly Community Group participants
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Warn on close. It's easy to accidentally hit Ctrl+W.
window.addEventListener('beforeunload', event => {
  event.preventDefault();
  event.returnValue = '';
});

window.addEventListener('resize', event => layout.updateSize());

let editor;
const run = debounceLazy(editor => api.compileLinkRun(editor.getValue()), 100);
const setKeyboard = name => editor.setKeyboardHandler(`ace/keyboard/${name}`);

function EditorComponent(container, state) {
  editor = ace.edit(container.getElement()[0]);
  editor.session.setMode('ace/mode/c_cpp');
  editor.setKeyboardHandler('ace/keyboard/vim');
  editor.setOption('fontSize',);
  editor.setValue(state.value || '');
  editor.clearSelection();

  const setFontSize = fontSize => {
    container.extendState({fontSize});
    editor.setFontSize(`${fontSize}px`);
  };

  setFontSize(state.fontSize || 18);

  editor.on('change', debounceLazy(event => {
    container.extendState({value: editor.getValue()});
  }, 500));

  container.on('fontSizeChanged', setFontSize);
  container.on('resize', debounceLazy(() => editor.resize(), 20));
  container.on('destroy', () => {
    if (editor) {
      editor.destroy();
      editor = null;
    }
  });
}

let term;
Terminal.applyAddon(fit);
function TerminalComponent(container, state) {
  const setFontSize = fontSize => {
    container.extendState({fontSize});
    term.setOption('fontSize', fontSize);
    term.fit();
  };
  container.on('open', () => {
    const fontSize = state.fontSize || 18;
    term = new Terminal({convertEol: true, disableStdin: true, fontSize});
    term.open(container.getElement()[0]);
    setFontSize(fontSize);
  });
  container.on('fontSizeChanged', setFontSize);
  container.on('resize', debounceLazy(() => term.fit(), 20));
  container.on('destroy', () => {
    if (term) {
      term.destroy();
      term = null;
    }
  });
}

class Layout extends GoldenLayout {
  constructor(options) {
    let layoutConfig = localStorage.getItem(options.configKey);
    if (layoutConfig) {
      layoutConfig = JSON.parse(layoutConfig);
    } else {
      layoutConfig = options.defaultLayoutConfig;
    }

    super(layoutConfig, $('#layout'));

    this.on('stateChanged', debounceLazy(() => {
      const state = JSON.stringify(this.toConfig());
      localStorage.setItem(options.configKey, state);
    }, 500));

    this.on('stackCreated', stack => {
      const fontSizeEl = document.createElement('div');

      const labelEl = document.createElement('label');
      labelEl.textContent = 'FontSize: ';
      fontSizeEl.appendChild(labelEl);

      const selectEl = document.createElement('select');
      fontSizeEl.className = 'font-size';
      fontSizeEl.appendChild(selectEl);

      const sizes = [6, 7, 8, 9, 10, 11, 12, 14, 18, 24, 30, 36, 48, 60, 72, 96];
      for (let size of sizes) {
        const optionEl = document.createElement('option');
        optionEl.value = size;
        optionEl.textContent = size;
        selectEl.appendChild(optionEl);
      }

      fontSizeEl.addEventListener('change', event => {
        const contentItem = stack.getActiveContentItem();
        const name = contentItem.config.componentName;
        contentItem.container.emit('fontSizeChanged', event.target.value);
      });

      stack.header.controlsContainer.prepend(fontSizeEl);

      stack.on('activeContentItemChanged', contentItem => {
        const name = contentItem.config.componentName;
        const state = contentItem.container.getState();
        if (state && state.fontSize) {
          fontSizeEl.style.display = '';
          selectEl.value = state.fontSize;
        } else {
          fontSizeEl.style.display = 'none';
        }
      });
    });

    this.registerComponent('editor', EditorComponent);
    this.registerComponent('terminal', TerminalComponent);
  }
}

class WorkerAPI {
  constructor() {
    this.nextResponseId = 0;
    this.responseCBs = new Map();
    this.worker = new Worker('worker.js');
    const channel = new MessageChannel();
    this.port = channel.port1;
    this.port.onmessage = this.onmessage.bind(this);

    const remotePort = channel.port2;
    this.worker.postMessage({id: 'constructor', data: remotePort},
                            [remotePort]);
  }

  setShowTiming(value) {
    this.port.postMessage({id: 'setShowTiming', data: value});
  }

  terminate() {
    this.worker.terminate();
  }

  async runAsync(id, options) {
    const responseId = this.nextResponseId++;
    const responsePromise = new Promise((resolve, reject) => {
      this.responseCBs.set(responseId, {resolve, reject});
    });
    this.port.postMessage({id, responseId, data : options});
    return await responsePromise;
  }

  async compileToAssembly(options) {
    return this.runAsync('compileToAssembly', options);
  }

  async compileTo6502(options) {
    return this.runAsync('compileTo6502', options);
  }

  compileLinkRun(contents) {
    this.port.postMessage({id: 'compileLinkRun', data: contents});
  }

  postCanvas(offscreenCanvas) {
    this.port.postMessage({id : 'postCanvas', data : offscreenCanvas},
                          [ offscreenCanvas ]);
  }

  onmessage(event) {
    switch (event.data.id) {
      case 'write':
        term.write(event.data.data);
        break;

      case 'runAsync': {
        const responseId = event.data.responseId;
        const promise = this.responseCBs.get(responseId);
        if (promise) {
          this.responseCBs.delete(responseId);
          promise.resolve(event.data.data);
        }
        break;
      }
    }
  }
}

const api = new WorkerAPI();
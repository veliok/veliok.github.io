self.importScripts('shared.js');

let api;
let port;

const apiOptions = {
  async readBuffer(filename) {
    const response = await fetch(filename);
    return response.arrayBuffer();
  },
  
  hostWrite(s) { port.postMessage({id : 'write', data : s}); }
};

let currentApp = null;

const onAnyMessage = async event => {
  switch (event.data.id) {
  case 'constructor':
    port = event.data.data;
    port.onmessage = onAnyMessage;
    api = new API(apiOptions);
    break;

  case 'setShowTiming':
    api.showTiming = event.data.data;
    break;

  case 'compileToAssembly': {
    const responseId = event.data.responseId;
    let output = null;
    let transferList;
    try {
      output = await api.compileToAssembly(event.data.data);
    } finally {
      port.postMessage({id : 'runAsync', responseId, data : output},
                       transferList);
    }
    break;
  }

  case 'compileTo6502': {
    const responseId = event.data.responseId;
    let output = null;
    let transferList;
    try {
      output = await api.compileTo6502(event.data.data);
    } finally {
      port.postMessage({id : 'runAsync', responseId, data : output},
                       transferList);
    }
    break;
  }

  case 'compileLinkRun':
    if (currentApp) {
      console.log('First, disallowing rAF from previous app.');
      // Stop running rAF on the previous app, if any.
      currentApp.allowRequestAnimationFrame = false;
    }
    currentApp = await api.compileLinkRun(event.data.data);
    console.log(`finished compileLinkRun. currentApp = ${currentApp}.`);
    break;

  case 'postCanvas':
    canvas = event.data.data;
    ctx2d = canvas.getContext('2d');
    break;
  }
};

self.onmessage = onAnyMessage;

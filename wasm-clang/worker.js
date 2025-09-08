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
  }
};

self.onmessage = onAnyMessage;

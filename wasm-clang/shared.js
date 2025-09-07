function sleep(ms) {
  return new Promise((resolve, _) => setTimeout(resolve, ms));
}

function readStr(u8, o, len = -1) {
  let str = '';
  let end = u8.length;
  if (len != -1)
    end = o + len;
  for (let i = o; i < end && u8[i] != 0; ++i)
    str += String.fromCharCode(u8[i]);
  return str;
}

function debounceLazy(f, ms) {
  let waiting = 0;
  let running = false;

  const wait = async () => {
    ++waiting;
    await sleep(ms);
    return --waiting === 0;
  };

  const wrapped = async (...args) => {
    if (await wait()) {
      while (running) await wait();
      running = true;
      try {
        await f(...args);
      } finally {
        running = false;
      }
    }
  };
  return wrapped;
}

const API = (function() {

class ProcExit extends Error {
  constructor(code) {
    super(`process exited with code ${code}.`);
    this.code = code;
  }
};

class NotImplemented extends Error {
  constructor(modname, fieldname) {
    super(`${modname}.${fieldname} not implemented.`);
  }
}

class AbortError extends Error {
  constructor(msg = 'abort') { super(msg); }
}

class AssertError extends Error {
  constructor(msg) { super(msg); }
}

function assert(cond) {
  if (!cond) {
    throw new AssertError('assertion failed.');
  }
}

function getInstance(module, imports) {
  return WebAssembly.instantiate(module, imports);
}

function getImportObject(obj, names) {
  const result = {};
  for (let name of names) {
    result[name] = obj[name].bind(obj);
  }
  return result;
}

function msToSec(start, end) {
  return ((end - start) / 1000).toFixed(2);
}

const ESUCCESS = 0;

class Memory {
  constructor(memory) {
    this.memory = memory;
    this.buffer = this.memory.buffer;
    this.u8 = new Uint8Array(this.buffer);
    this.u32 = new Uint32Array(this.buffer);
  }

  check() {
    if (this.buffer.byteLength === 0) {
      this.buffer = this.memory.buffer;
      this.u8 = new Uint8Array(this.buffer);
      this.u32 = new Uint32Array(this.buffer);
    }
  }

  read8(o) { return this.u8[o]; }
  read32(o) { return this.u32[o >> 2]; }
  write8(o, v) { this.u8[o] = v; }
  write32(o, v) { this.u32[o >> 2] = v; }
  write64(o, vlo, vhi = 0) { this.write32(o, vlo); this.write32(o + 4, vhi); }

  readStr(o, len) {
    return readStr(this.u8, o, len);
  }

  // Null-terminated string.
  writeStr(o, str) {
    o += this.write(o, str);
    this.write8(o, 0);
    return str.length + 1;
  }

  write(o, buf) {
    if (buf instanceof ArrayBuffer) {
      return this.write(o, new Uint8Array(buf));
    } else if (typeof buf === 'string') {
      return this.write(o, buf.split('').map(x => x.charCodeAt(0)));
    } else {
      const dst = new Uint8Array(this.buffer, o, buf.length);
      dst.set(buf);
      return buf.length;
    }
  }
};

class MemFS {
  constructor(options) {
    const compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;
    this.stdinStr = options.stdinStr || "";
    this.stdinStrPos = 0;
    this.memfsFilename = options.memfsFilename;

    this.hostMem_ = null;  // Set later when wired up to application.

    // Imports for memfs module.
    const env = getImportObject(
        this, [ 'abort', 'host_write', 'host_read', 'memfs_log', 'copy_in', 'copy_out' ]);

    this.ready = compileStreaming(this.memfsFilename)
                     .then(module => WebAssembly.instantiate(module, {env}))
                     .then(instance => {
                       this.instance = instance;
                       this.exports = instance.exports;
                       this.mem = new Memory(this.exports.memory);
                       this.exports.init();
                     })
  }

  set hostMem(mem) {
    this.hostMem_ = mem;
  }

  setStdinStr(str) {
    this.stdinStr = str;
    this.stdinStrPos = 0;
  }

  addDirectory(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    this.exports.AddDirectoryNode(path.length);
  }

  addFile(path, contents) {
    const length =
        contents instanceof ArrayBuffer ? contents.byteLength : contents.length;
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.AddFileNode(path.length, length);
    const addr = this.exports.GetFileNodeAddress(inode);
    this.mem.check();
    this.mem.write(addr, contents);
  }

  getFileContents(path) {
    this.mem.check();
    this.mem.write(this.exports.GetPathBuf(), path);
    const inode = this.exports.FindNode(path.length);
    const addr = this.exports.GetFileNodeAddress(inode);
    const size = this.exports.GetFileNodeSize(inode);
    return new Uint8Array(this.mem.buffer, addr, size);
  }

  abort() { throw new AbortError(); }

  host_write(fd, iovs, iovs_len, nwritten_out) {
    this.hostMem_.check();
    assert(fd <= 2);
    let size = 0;
    let str = '';
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      str += this.hostMem_.readStr(buf, len);
      size += len;
    }
    this.hostMem_.write32(nwritten_out, size);
    this.hostWrite(str);
    return ESUCCESS;
  }

  host_read(fd, iovs, iovs_len, nread) {
    this.hostMem_.check();
    assert(fd === 0);
    let size = 0;
    for (let i = 0; i < iovs_len; ++i) {
      const buf = this.hostMem_.read32(iovs);
      iovs += 4;
      const len = this.hostMem_.read32(iovs);
      iovs += 4;
      const lenToWrite = Math.min(len, (this.stdinStr.length - this.stdinStrPos));
      if(lenToWrite === 0){
        break;
      }
      this.hostMem_.write(buf, this.stdinStr.substr(this.stdinStrPos, lenToWrite));
      size += lenToWrite;
      this.stdinStrPos += lenToWrite;
      if(lenToWrite !== len){
        break;
      }
    }
    // For logging
    // this.hostWrite("Read "+ size + "bytes, pos: "+ this.stdinStrPos + "\n");
    this.hostMem_.write32(nread, size);
    return ESUCCESS;
  }

  memfs_log(buf, len) {
    this.mem.check();
    console.log(this.mem.readStr(buf, len));
  }

  copy_out(clang_dst, memfs_src, size) {
    this.hostMem_.check();
    const dst = new Uint8Array(this.hostMem_.buffer, clang_dst, size);
    this.mem.check();
    const src = new Uint8Array(this.mem.buffer, memfs_src, size);
    // console.log(`copy_out(${clang_dst.toString(16)}, ${memfs_src.toString(16)}, ${size})`);
    dst.set(src);
  }

  copy_in(memfs_dst, clang_src, size) {
    this.mem.check();
    const dst = new Uint8Array(this.mem.buffer, memfs_dst, size);
    this.hostMem_.check();
    const src = new Uint8Array(this.hostMem_.buffer, clang_src, size);
    // console.log(`copy_in(${memfs_dst.toString(16)}, ${clang_src.toString(16)}, ${size})`);
    dst.set(src);
  }
}

const RAF_PROC_EXIT_CODE = 0xC0C0A;

class Tar {
  constructor(buffer) {
    this.u8 = new Uint8Array(buffer);
    this.offset = 0;
  }

  readStr(len) {
    const result = readStr(this.u8, this.offset, len);
    this.offset += len;
    return result;
  }

  readOctal(len) {
    return parseInt(this.readStr(len), 8);
  }

  alignUp() {
    this.offset = (this.offset + 511) & ~511;
  }

  readEntry() {
    if (this.offset + 512 > this.u8.length) {
      return null;
    }

    const entry = {
      filename : this.readStr(100),
      mode : this.readOctal(8),
      owner : this.readOctal(8),
      group : this.readOctal(8),
      size : this.readOctal(12),
      mtim : this.readOctal(12),
      checksum : this.readOctal(8),
      type : this.readStr(1),
      linkname : this.readStr(100),
    };

    if (this.readStr(8) !== 'ustar  ') {
      return null;
    }

    entry.ownerName = this.readStr(32);
    entry.groupName = this.readStr(32);
    entry.devMajor = this.readStr(8);
    entry.devMinor = this.readStr(8);
    entry.filenamePrefix = this.readStr(155);
    this.alignUp();

    if (entry.type === '0') {        // Regular file.
      entry.contents = this.u8.subarray(this.offset, this.offset + entry.size);
      this.offset += entry.size;
      this.alignUp();
    } else if (entry.type !== '5') { // Directory.
      console.log('type', entry.type);
      assert(false);
    }
    return entry;
  }

  untar(memfs) {
    let entry;
    while (entry = this.readEntry()) {
      switch (entry.type) {
      case '0': // Regular file.
        memfs.addFile(entry.filename, entry.contents);
        break;
      case '5':
        memfs.addDirectory(entry.filename);
        break;
      }
    }
  }
}

class API {
  constructor(options) {
    this.moduleCache = {};
    this.readBuffer = options.readBuffer;
    this.compileStreaming = options.compileStreaming;
    this.hostWrite = options.hostWrite;
    this.clangFilename = options.clang || 'clang';
    this.lldFilename = options.lld || 'lld';
    this.sysrootFilename = options.sysroot || 'sysroot.tar';
    this.showTiming = options.showTiming || false;

    this.clangCommonArgs = [
      '-disable-free',
      '-isysroot', '/',
      '-internal-isystem', '/include/c++/v1',
      '-internal-isystem', '/include',
      '-internal-isystem', '/lib/clang/8.0.1/include',
      '-ferror-limit', '19',
      '-fmessage-length', '80',
      '-fcolor-diagnostics',
    ];

    this.memfs = new MemFS({
      compileStreaming : this.compileStreaming,
      hostWrite : this.hostWrite,
      memfsFilename : options.memfs || 'memfs',
    });
    this.ready = this.memfs.ready.then(
        () => { return this.untar(this.memfs, this.sysrootFilename); });
  }

  hostLog(message) {
    const yellowArrow = '\x1b[1;93m>\x1b[0m ';
    this.hostWrite(`${yellowArrow}${message}`);
  }

  async hostLogAsync(message, promise) {
    const start = +new Date();
    this.hostLog(`${message}...`);
    const result = await promise;
    const end = +new Date();
    this.hostWrite(' done.');
    if (this.showTiming) {
      const green = '\x1b[92m';
      const normal = '\x1b[0m';
      this.hostWrite(` ${green}(${msToSec(start, end)}s)${normal}\n`);
    }
    this.hostWrite('\n');
    return result;
  }

  async getModule(name) {
    if (this.moduleCache[name]) return this.moduleCache[name];
    const module = await this.hostLogAsync(`Fetching and compiling ${name}`,
                                           this.compileStreaming(name));
    this.moduleCache[name] = module;
    return module;
  }

  async untar(memfs, filename) {
    await this.memfs.ready;
    const promise = (async () => {
      const tar = new Tar(await this.readBuffer(filename));
      tar.untar(this.memfs);
    })();
    await this.hostLogAsync(`Untarring ${filename}`, promise);
  }

  async compile(options) {
    const input = options.input;
    const contents = options.contents;
    const obj = options.obj;
    const opt = options.opt || '2';

    await this.ready;
    this.memfs.addFile(input, contents);
    const clang = await this.getModule(this.clangFilename);
    return await this.run(clang, 'clang', '-cc1', '-emit-obj',
                          ...this.clangCommonArgs, '-O2', '-o', obj, '-x',
                          'c++', input);
  }

  async compileToAssembly(options) {
    const input = options.input;
    const output = options.output;
    const contents = options.contents;
    const obj = options.obj;
    const triple = options.triple || 'x86_64';
    const opt = options.opt || '2';

    await this.ready;
    this.memfs.addFile(input, contents);
    const clang = await this.getModule(this.clangFilename);
    await this.run(clang, 'clang', '-cc1', '-S', ...this.clangCommonArgs,
                          `-triple=${triple}`, '-mllvm',
                          '--x86-asm-syntax=intel', `-O${opt}`,
                          '-o', output, '-x', 'c++', input);
    return this.memfs.getFileContents(output);
  }

  async compileTo6502(options) {
    const input = options.input;
    const output = options.output;
    const contents = options.contents;
    const flags = options.flags;

    await this.ready;
    this.memfs.addFile(input, contents);
    const vasm = await this.getModule('vasm6502_oldstyle');
    await this.run(vasm, 'vasm6502_oldstyle', ...flags, '-o', output, input);
    return this.memfs.getFileContents(output);
  }

  async link(obj, wasm) {
    const stackSize = 1024 * 1024;

    const libdir = 'lib/wasm32-wasi';
    const crt1 = `${libdir}/crt1.o`;
    await this.ready;
    const lld = await this.getModule(this.lldFilename);
    return await this.run(
        lld, 'wasm-ld', '--no-threads',
        '--export-dynamic',  // TODO required?
        '-z', `stack-size=${stackSize}`, `-L${libdir}`, crt1, obj, '-lc',
        '-lc++', '-lc++abi', '-lcanvas', '-o', wasm)
  }

  async run(module, ...args) {
    this.hostLog(`${args.join(' ')}\n`);
    const start = +new Date();
    const app = new App(module, this.memfs, ...args);
    const instantiate = +new Date();
    const stillRunning = await app.run();
    const end = +new Date();
    this.hostWrite('\n');
    if (this.showTiming) {
      const green = '\x1b[92m';
      const normal = '\x1b[0m';
      let msg = `${green}(${msToSec(start, instantiate)}s`;
      msg += `/${msToSec(instantiate, end)}s)${normal}\n`;
      this.hostWrite(msg);
    }
    return stillRunning ? app : null;
  }

  async compileLinkRun(contents) {
    const input = `test.cc`;
    const obj = `test.o`;
    const wasm = `test.wasm`;
    await this.compile({input, contents, obj});
    await this.link(obj, wasm);

    const buffer = this.memfs.getFileContents(wasm);
    const testMod = await this.hostLogAsync(`Compiling ${wasm}`,
                                            WebAssembly.compile(buffer));
    return await this.run(testMod, wasm);
  }
}

return API;

})();

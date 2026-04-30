(function() {
	var e, r = (e = "undefined" != typeof document && document.currentScript ? document.currentScript.src : void 0, function(r = {}) {
		var t, a, n = r;
		n.ready = new Promise((e, r) => {
			t = e, a = r;
		});
		var o, i, s, _ = Object.assign({}, n), c = "./this.program", d = (e, r) => {
			throw r;
		}, p = "";
		p = self.location.href, e && (p = e), p = p.startsWith("blob:") ? "" : p.substr(0, p.replace(/[?#].*/, "").lastIndexOf("/") + 1), o = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.send(null), r.responseText;
		}, s = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
		}, i = (e, r, t) => {
			var a = new XMLHttpRequest();
			a.open("GET", e, !0), a.responseType = "arraybuffer", a.onload = () => {
				200 == a.status || 0 == a.status && a.response ? r(a.response) : t();
			}, a.onerror = t, a.send(null);
		};
		var l, u, m = n.print || console.log.bind(console), f = n.printErr || console.error.bind(console);
		Object.assign(n, _), _ = null, n.arguments && n.arguments, n.thisProgram && (c = n.thisProgram), n.quit && (d = n.quit), n.wasmBinary && (l = n.wasmBinary), "object" != typeof WebAssembly && j("no native wasm support detected");
		var h, g, v, w, y, k, b, E, z, x = !1;
		function L(e, r) {
			e || j(r);
		}
		function S() {
			var e = u.buffer;
			n.HEAP8 = g = new Int8Array(e), n.HEAP16 = w = new Int16Array(e), n.HEAPU8 = v = new Uint8Array(e), n.HEAPU16 = y = new Uint16Array(e), n.HEAP32 = k = new Int32Array(e), n.HEAPU32 = b = new Uint32Array(e), n.HEAPF32 = E = new Float32Array(e), n.HEAPF64 = z = new Float64Array(e);
		}
		var M = [], F = [], D = [], P = !1;
		function A(e) {
			M.unshift(e);
		}
		function C(e) {
			D.unshift(e);
		}
		var R = 0, T = null, O = null;
		function I(e) {
			R++, n.monitorRunDependencies?.(R);
		}
		function N(e) {
			if (R--, n.monitorRunDependencies?.(R), 0 == R && (null !== T && (clearInterval(T), T = null), O)) {
				var r = O;
				O = null, r();
			}
		}
		function j(e) {
			n.onAbort?.(e), f(e = "Aborted(" + e + ")"), x = !0, h = 1, e += ". Build with -sASSERTIONS for more info.", P && rr();
			var r = new WebAssembly.RuntimeError(e);
			throw a(r), r;
		}
		var q, B, U, Y = "zappar-cv.wasm";
		function G(e, r) {
			var t, a = function(e) {
				if (e == Y && l) return new Uint8Array(l);
				if (s) return s(e);
				throw "sync fetching of the wasm failed: you can preload it to Module[\"wasmBinary\"] manually, or emcc.py will do that for you when generating HTML (but not JS)";
			}(e);
			return t = new WebAssembly.Module(a), [new WebAssembly.Instance(t, r), t];
		}
		function H(e) {
			this.name = "ExitStatus", this.message = `Program terminated with exit(${e})`, this.status = e;
		}
		Y.startsWith("data:application/octet-stream;base64,") || (q = Y, Y = n.locateFile ? n.locateFile(q, p) : p + q);
		var W = (e) => {
			for (; e.length > 0;) e.shift()(n);
		}, X = n.noExitRuntime || !0, Z = {
			isAbs: (e) => "/" === e.charAt(0),
			splitPath: (e) => /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1),
			normalizeArray: (e, r) => {
				for (var t = 0, a = e.length - 1; a >= 0; a--) {
					var n = e[a];
					"." === n ? e.splice(a, 1) : ".." === n ? (e.splice(a, 1), t++) : t && (e.splice(a, 1), t--);
				}
				if (r) for (; t; t--) e.unshift("..");
				return e;
			},
			normalize: (e) => {
				var r = Z.isAbs(e), t = "/" === e.substr(-1);
				return (e = Z.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || r || (e = "."), e && t && (e += "/"), (r ? "/" : "") + e;
			},
			dirname: (e) => {
				var r = Z.splitPath(e), t = r[0], a = r[1];
				return t || a ? (a && (a = a.substr(0, a.length - 1)), t + a) : ".";
			},
			basename: (e) => {
				if ("/" === e) return "/";
				var r = (e = (e = Z.normalize(e)).replace(/\/$/, "")).lastIndexOf("/");
				return -1 === r ? e : e.substr(r + 1);
			},
			join: function() {
				var e = Array.prototype.slice.call(arguments);
				return Z.normalize(e.join("/"));
			},
			join2: (e, r) => Z.normalize(e + "/" + r)
		}, V = (e) => (V = (() => {
			if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) return (e) => crypto.getRandomValues(e);
			j("initRandomDevice");
		})())(e), $ = {
			resolve: function() {
				for (var e = "", r = !1, t = arguments.length - 1; t >= -1 && !r; t--) {
					var a = t >= 0 ? arguments[t] : ce.cwd();
					if ("string" != typeof a) throw new TypeError("Arguments to path.resolve must be strings");
					if (!a) return "";
					e = a + "/" + e, r = Z.isAbs(a);
				}
				return (r ? "/" : "") + (e = Z.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || ".";
			},
			relative: (e, r) => {
				function t(e) {
					for (var r = 0; r < e.length && "" === e[r]; r++);
					for (var t = e.length - 1; t >= 0 && "" === e[t]; t--);
					return r > t ? [] : e.slice(r, t - r + 1);
				}
				e = $.resolve(e).substr(1), r = $.resolve(r).substr(1);
				for (var a = t(e.split("/")), n = t(r.split("/")), o = Math.min(a.length, n.length), i = o, s = 0; s < o; s++) if (a[s] !== n[s]) {
					i = s;
					break;
				}
				var _ = [];
				for (s = i; s < a.length; s++) _.push("..");
				return (_ = _.concat(n.slice(i))).join("/");
			}
		}, K = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, J = (e, r, t) => {
			for (var a = r + t, n = r; e[n] && !(n >= a);) ++n;
			if (n - r > 16 && e.buffer && K) return K.decode(e.subarray(r, n));
			for (var o = ""; r < n;) {
				var i = e[r++];
				if (128 & i) {
					var s = 63 & e[r++];
					if (192 != (224 & i)) {
						var _ = 63 & e[r++];
						if ((i = 224 == (240 & i) ? (15 & i) << 12 | s << 6 | _ : (7 & i) << 18 | s << 12 | _ << 6 | 63 & e[r++]) < 65536) o += String.fromCharCode(i);
						else {
							var c = i - 65536;
							o += String.fromCharCode(55296 | c >> 10, 56320 | 1023 & c);
						}
					} else o += String.fromCharCode((31 & i) << 6 | s);
				} else o += String.fromCharCode(i);
			}
			return o;
		}, Q = [], ee = (e) => {
			for (var r = 0, t = 0; t < e.length; ++t) {
				var a = e.charCodeAt(t);
				a <= 127 ? r++ : a <= 2047 ? r += 2 : a >= 55296 && a <= 57343 ? (r += 4, ++t) : r += 3;
			}
			return r;
		}, re = (e, r, t, a) => {
			if (!(a > 0)) return 0;
			for (var n = t, o = t + a - 1, i = 0; i < e.length; ++i) {
				var s = e.charCodeAt(i);
				if (s >= 55296 && s <= 57343 && (s = 65536 + ((1023 & s) << 10) | 1023 & e.charCodeAt(++i)), s <= 127) {
					if (t >= o) break;
					r[t++] = s;
				} else if (s <= 2047) {
					if (t + 1 >= o) break;
					r[t++] = 192 | s >> 6, r[t++] = 128 | 63 & s;
				} else if (s <= 65535) {
					if (t + 2 >= o) break;
					r[t++] = 224 | s >> 12, r[t++] = 128 | s >> 6 & 63, r[t++] = 128 | 63 & s;
				} else {
					if (t + 3 >= o) break;
					r[t++] = 240 | s >> 18, r[t++] = 128 | s >> 12 & 63, r[t++] = 128 | s >> 6 & 63, r[t++] = 128 | 63 & s;
				}
			}
			return r[t] = 0, t - n;
		};
		function te(e, r, t) {
			var a = t > 0 ? t : ee(e) + 1, n = new Array(a), o = re(e, n, 0, n.length);
			return r && (n.length = o), n;
		}
		var ae, ne = {
			ttys: [],
			init() {},
			shutdown() {},
			register(e, r) {
				ne.ttys[e] = {
					input: [],
					output: [],
					ops: r
				}, ce.registerDevice(e, ne.stream_ops);
			},
			stream_ops: {
				open(e) {
					var r = ne.ttys[e.node.rdev];
					if (!r) throw new ce.ErrnoError(43);
					e.tty = r, e.seekable = !1;
				},
				close(e) {
					e.tty.ops.fsync(e.tty);
				},
				fsync(e) {
					e.tty.ops.fsync(e.tty);
				},
				read(e, r, t, a, n) {
					if (!e.tty || !e.tty.ops.get_char) throw new ce.ErrnoError(60);
					for (var o = 0, i = 0; i < a; i++) {
						var s;
						try {
							s = e.tty.ops.get_char(e.tty);
						} catch (_) {
							throw new ce.ErrnoError(29);
						}
						if (void 0 === s && 0 === o) throw new ce.ErrnoError(6);
						if (null == s) break;
						o++, r[t + i] = s;
					}
					return o && (e.node.timestamp = Date.now()), o;
				},
				write(e, r, t, a, n) {
					if (!e.tty || !e.tty.ops.put_char) throw new ce.ErrnoError(60);
					try {
						for (var o = 0; o < a; o++) e.tty.ops.put_char(e.tty, r[t + o]);
					} catch (i) {
						throw new ce.ErrnoError(29);
					}
					return a && (e.node.timestamp = Date.now()), o;
				}
			},
			default_tty_ops: {
				get_char: (e) => (() => {
					if (!Q.length) {
						var e = null;
						if ("undefined" != typeof window && "function" == typeof window.prompt ? null !== (e = window.prompt("Input: ")) && (e += "\n") : "function" == typeof readline && null !== (e = readline()) && (e += "\n"), !e) return null;
						Q = te(e, !0);
					}
					return Q.shift();
				})(),
				put_char(e, r) {
					null === r || 10 === r ? (m(J(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (m(J(e.output, 0)), e.output = []);
				},
				ioctl_tcgets: (e) => ({
					c_iflag: 25856,
					c_oflag: 5,
					c_cflag: 191,
					c_lflag: 35387,
					c_cc: [
						3,
						28,
						127,
						21,
						4,
						0,
						1,
						0,
						17,
						19,
						26,
						0,
						18,
						15,
						23,
						22,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0,
						0
					]
				}),
				ioctl_tcsets: (e, r, t) => 0,
				ioctl_tiocgwinsz: (e) => [24, 80]
			},
			default_tty1_ops: {
				put_char(e, r) {
					null === r || 10 === r ? (f(J(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (f(J(e.output, 0)), e.output = []);
				}
			}
		}, oe = (e) => {
			j();
		}, ie = {
			ops_table: null,
			mount: (e) => ie.createNode(null, "/", 16895, 0),
			createNode(e, r, t, a) {
				if (ce.isBlkdev(t) || ce.isFIFO(t)) throw new ce.ErrnoError(63);
				ie.ops_table ||= {
					dir: {
						node: {
							getattr: ie.node_ops.getattr,
							setattr: ie.node_ops.setattr,
							lookup: ie.node_ops.lookup,
							mknod: ie.node_ops.mknod,
							rename: ie.node_ops.rename,
							unlink: ie.node_ops.unlink,
							rmdir: ie.node_ops.rmdir,
							readdir: ie.node_ops.readdir,
							symlink: ie.node_ops.symlink
						},
						stream: { llseek: ie.stream_ops.llseek }
					},
					file: {
						node: {
							getattr: ie.node_ops.getattr,
							setattr: ie.node_ops.setattr
						},
						stream: {
							llseek: ie.stream_ops.llseek,
							read: ie.stream_ops.read,
							write: ie.stream_ops.write,
							allocate: ie.stream_ops.allocate,
							mmap: ie.stream_ops.mmap,
							msync: ie.stream_ops.msync
						}
					},
					link: {
						node: {
							getattr: ie.node_ops.getattr,
							setattr: ie.node_ops.setattr,
							readlink: ie.node_ops.readlink
						},
						stream: {}
					},
					chrdev: {
						node: {
							getattr: ie.node_ops.getattr,
							setattr: ie.node_ops.setattr
						},
						stream: ce.chrdev_stream_ops
					}
				};
				var n = ce.createNode(e, r, t, a);
				return ce.isDir(n.mode) ? (n.node_ops = ie.ops_table.dir.node, n.stream_ops = ie.ops_table.dir.stream, n.contents = {}) : ce.isFile(n.mode) ? (n.node_ops = ie.ops_table.file.node, n.stream_ops = ie.ops_table.file.stream, n.usedBytes = 0, n.contents = null) : ce.isLink(n.mode) ? (n.node_ops = ie.ops_table.link.node, n.stream_ops = ie.ops_table.link.stream) : ce.isChrdev(n.mode) && (n.node_ops = ie.ops_table.chrdev.node, n.stream_ops = ie.ops_table.chrdev.stream), n.timestamp = Date.now(), e && (e.contents[r] = n, e.timestamp = n.timestamp), n;
			},
			getFileDataAsTypedArray: (e) => e.contents ? e.contents.subarray ? e.contents.subarray(0, e.usedBytes) : new Uint8Array(e.contents) : new Uint8Array(0),
			expandFileStorage(e, r) {
				var t = e.contents ? e.contents.length : 0;
				if (!(t >= r)) {
					r = Math.max(r, t * (t < 1048576 ? 2 : 1.125) >>> 0), 0 != t && (r = Math.max(r, 256));
					var a = e.contents;
					e.contents = new Uint8Array(r), e.usedBytes > 0 && e.contents.set(a.subarray(0, e.usedBytes), 0);
				}
			},
			resizeFileStorage(e, r) {
				if (e.usedBytes != r) if (0 == r) e.contents = null, e.usedBytes = 0;
				else {
					var t = e.contents;
					e.contents = new Uint8Array(r), t && e.contents.set(t.subarray(0, Math.min(r, e.usedBytes))), e.usedBytes = r;
				}
			},
			node_ops: {
				getattr(e) {
					var r = {};
					return r.dev = ce.isChrdev(e.mode) ? e.id : 1, r.ino = e.id, r.mode = e.mode, r.nlink = 1, r.uid = 0, r.gid = 0, r.rdev = e.rdev, ce.isDir(e.mode) ? r.size = 4096 : ce.isFile(e.mode) ? r.size = e.usedBytes : ce.isLink(e.mode) ? r.size = e.link.length : r.size = 0, r.atime = new Date(e.timestamp), r.mtime = new Date(e.timestamp), r.ctime = new Date(e.timestamp), r.blksize = 4096, r.blocks = Math.ceil(r.size / r.blksize), r;
				},
				setattr(e, r) {
					void 0 !== r.mode && (e.mode = r.mode), void 0 !== r.timestamp && (e.timestamp = r.timestamp), void 0 !== r.size && ie.resizeFileStorage(e, r.size);
				},
				lookup(e, r) {
					throw ce.genericErrors[44];
				},
				mknod: (e, r, t, a) => ie.createNode(e, r, t, a),
				rename(e, r, t) {
					if (ce.isDir(e.mode)) {
						var a;
						try {
							a = ce.lookupNode(r, t);
						} catch (o) {}
						if (a) for (var n in a.contents) throw new ce.ErrnoError(55);
					}
					delete e.parent.contents[e.name], e.parent.timestamp = Date.now(), e.name = t, r.contents[t] = e, r.timestamp = e.parent.timestamp, e.parent = r;
				},
				unlink(e, r) {
					delete e.contents[r], e.timestamp = Date.now();
				},
				rmdir(e, r) {
					for (var t in ce.lookupNode(e, r).contents) throw new ce.ErrnoError(55);
					delete e.contents[r], e.timestamp = Date.now();
				},
				readdir(e) {
					var r = [".", ".."];
					for (var t of Object.keys(e.contents)) r.push(t);
					return r;
				},
				symlink(e, r, t) {
					var a = ie.createNode(e, r, 41471, 0);
					return a.link = t, a;
				},
				readlink(e) {
					if (!ce.isLink(e.mode)) throw new ce.ErrnoError(28);
					return e.link;
				}
			},
			stream_ops: {
				read(e, r, t, a, n) {
					var o = e.node.contents;
					if (n >= e.node.usedBytes) return 0;
					var i = Math.min(e.node.usedBytes - n, a);
					if (i > 8 && o.subarray) r.set(o.subarray(n, n + i), t);
					else for (var s = 0; s < i; s++) r[t + s] = o[n + s];
					return i;
				},
				write(e, r, t, a, n, o) {
					if (r.buffer === g.buffer && (o = !1), !a) return 0;
					var i = e.node;
					if (i.timestamp = Date.now(), r.subarray && (!i.contents || i.contents.subarray)) {
						if (o) return i.contents = r.subarray(t, t + a), i.usedBytes = a, a;
						if (0 === i.usedBytes && 0 === n) return i.contents = r.slice(t, t + a), i.usedBytes = a, a;
						if (n + a <= i.usedBytes) return i.contents.set(r.subarray(t, t + a), n), a;
					}
					if (ie.expandFileStorage(i, n + a), i.contents.subarray && r.subarray) i.contents.set(r.subarray(t, t + a), n);
					else for (var s = 0; s < a; s++) i.contents[n + s] = r[t + s];
					return i.usedBytes = Math.max(i.usedBytes, n + a), a;
				},
				llseek(e, r, t) {
					var a = r;
					if (1 === t ? a += e.position : 2 === t && ce.isFile(e.node.mode) && (a += e.node.usedBytes), a < 0) throw new ce.ErrnoError(28);
					return a;
				},
				allocate(e, r, t) {
					ie.expandFileStorage(e.node, r + t), e.node.usedBytes = Math.max(e.node.usedBytes, r + t);
				},
				mmap(e, r, t, a, n) {
					if (!ce.isFile(e.node.mode)) throw new ce.ErrnoError(43);
					var o, i, s = e.node.contents;
					if (2 & n || s.buffer !== g.buffer) {
						if ((t > 0 || t + r < s.length) && (s = s.subarray ? s.subarray(t, t + r) : Array.prototype.slice.call(s, t, t + r)), i = !0, !(o = oe())) throw new ce.ErrnoError(48);
						g.set(s, o);
					} else i = !1, o = s.byteOffset;
					return {
						ptr: o,
						allocated: i
					};
				},
				msync: (e, r, t, a, n) => (ie.stream_ops.write(e, r, 0, a, t, !1), 0)
			}
		}, se = n.preloadPlugins || [], _e = (e, r) => {
			var t = 0;
			return e && (t |= 365), r && (t |= 146), t;
		}, ce = {
			root: null,
			mounts: [],
			devices: {},
			streams: [],
			nextInode: 1,
			nameTable: null,
			currentPath: "/",
			initialized: !1,
			ignorePermissions: !0,
			ErrnoError: class {
				constructor(e) {
					this.name = "ErrnoError", this.errno = e;
				}
			},
			genericErrors: {},
			filesystems: null,
			syncFSRequests: 0,
			lookupPath(e, r = {}) {
				if (!(e = $.resolve(e))) return {
					path: "",
					node: null
				};
				if ((r = Object.assign({
					follow_mount: !0,
					recurse_count: 0
				}, r)).recurse_count > 8) throw new ce.ErrnoError(32);
				for (var t = e.split("/").filter((e) => !!e), a = ce.root, n = "/", o = 0; o < t.length; o++) {
					var i = o === t.length - 1;
					if (i && r.parent) break;
					if (a = ce.lookupNode(a, t[o]), n = Z.join2(n, t[o]), ce.isMountpoint(a) && (!i || i && r.follow_mount) && (a = a.mounted.root), !i || r.follow) for (var s = 0; ce.isLink(a.mode);) {
						var _ = ce.readlink(n);
						if (n = $.resolve(Z.dirname(n), _), a = ce.lookupPath(n, { recurse_count: r.recurse_count + 1 }).node, s++ > 40) throw new ce.ErrnoError(32);
					}
				}
				return {
					path: n,
					node: a
				};
			},
			getPath(e) {
				for (var r;;) {
					if (ce.isRoot(e)) {
						var t = e.mount.mountpoint;
						return r ? "/" !== t[t.length - 1] ? `${t}/${r}` : t + r : t;
					}
					r = r ? `${e.name}/${r}` : e.name, e = e.parent;
				}
			},
			hashName(e, r) {
				for (var t = 0, a = 0; a < r.length; a++) t = (t << 5) - t + r.charCodeAt(a) | 0;
				return (e + t >>> 0) % ce.nameTable.length;
			},
			hashAddNode(e) {
				var r = ce.hashName(e.parent.id, e.name);
				e.name_next = ce.nameTable[r], ce.nameTable[r] = e;
			},
			hashRemoveNode(e) {
				var r = ce.hashName(e.parent.id, e.name);
				if (ce.nameTable[r] === e) ce.nameTable[r] = e.name_next;
				else for (var t = ce.nameTable[r]; t;) {
					if (t.name_next === e) {
						t.name_next = e.name_next;
						break;
					}
					t = t.name_next;
				}
			},
			lookupNode(e, r) {
				var t = ce.mayLookup(e);
				if (t) throw new ce.ErrnoError(t);
				for (var a = ce.hashName(e.id, r), n = ce.nameTable[a]; n; n = n.name_next) {
					var o = n.name;
					if (n.parent.id === e.id && o === r) return n;
				}
				return ce.lookup(e, r);
			},
			createNode(e, r, t, a) {
				var n = new ce.FSNode(e, r, t, a);
				return ce.hashAddNode(n), n;
			},
			destroyNode(e) {
				ce.hashRemoveNode(e);
			},
			isRoot: (e) => e === e.parent,
			isMountpoint: (e) => !!e.mounted,
			isFile: (e) => 32768 == (61440 & e),
			isDir: (e) => 16384 == (61440 & e),
			isLink: (e) => 40960 == (61440 & e),
			isChrdev: (e) => 8192 == (61440 & e),
			isBlkdev: (e) => 24576 == (61440 & e),
			isFIFO: (e) => 4096 == (61440 & e),
			isSocket: (e) => !(49152 & ~e),
			flagsToPermissionString(e) {
				var r = [
					"r",
					"w",
					"rw"
				][3 & e];
				return 512 & e && (r += "w"), r;
			},
			nodePermissions: (e, r) => ce.ignorePermissions || (!r.includes("r") || 292 & e.mode) && (!r.includes("w") || 146 & e.mode) && (!r.includes("x") || 73 & e.mode) ? 0 : 2,
			mayLookup(e) {
				if (!ce.isDir(e.mode)) return 54;
				return ce.nodePermissions(e, "x") || (e.node_ops.lookup ? 0 : 2);
			},
			mayCreate(e, r) {
				try {
					return ce.lookupNode(e, r), 20;
				} catch (t) {}
				return ce.nodePermissions(e, "wx");
			},
			mayDelete(e, r, t) {
				var a;
				try {
					a = ce.lookupNode(e, r);
				} catch (o) {
					return o.errno;
				}
				var n = ce.nodePermissions(e, "wx");
				if (n) return n;
				if (t) {
					if (!ce.isDir(a.mode)) return 54;
					if (ce.isRoot(a) || ce.getPath(a) === ce.cwd()) return 10;
				} else if (ce.isDir(a.mode)) return 31;
				return 0;
			},
			mayOpen: (e, r) => e ? ce.isLink(e.mode) ? 32 : ce.isDir(e.mode) && ("r" !== ce.flagsToPermissionString(r) || 512 & r) ? 31 : ce.nodePermissions(e, ce.flagsToPermissionString(r)) : 44,
			MAX_OPEN_FDS: 4096,
			nextfd() {
				for (var e = 0; e <= ce.MAX_OPEN_FDS; e++) if (!ce.streams[e]) return e;
				throw new ce.ErrnoError(33);
			},
			getStreamChecked(e) {
				var r = ce.getStream(e);
				if (!r) throw new ce.ErrnoError(8);
				return r;
			},
			getStream: (e) => ce.streams[e],
			createStream: (e, r = -1) => (ce.FSStream || (ce.FSStream = function() {
				this.shared = {};
			}, ce.FSStream.prototype = {}, Object.defineProperties(ce.FSStream.prototype, {
				object: {
					get() {
						return this.node;
					},
					set(e) {
						this.node = e;
					}
				},
				isRead: { get() {
					return 1 != (2097155 & this.flags);
				} },
				isWrite: { get() {
					return !!(2097155 & this.flags);
				} },
				isAppend: { get() {
					return 1024 & this.flags;
				} },
				flags: {
					get() {
						return this.shared.flags;
					},
					set(e) {
						this.shared.flags = e;
					}
				},
				position: {
					get() {
						return this.shared.position;
					},
					set(e) {
						this.shared.position = e;
					}
				}
			})), e = Object.assign(new ce.FSStream(), e), -1 == r && (r = ce.nextfd()), e.fd = r, ce.streams[r] = e, e),
			closeStream(e) {
				ce.streams[e] = null;
			},
			chrdev_stream_ops: {
				open(e) {
					e.stream_ops = ce.getDevice(e.node.rdev).stream_ops, e.stream_ops.open?.(e);
				},
				llseek() {
					throw new ce.ErrnoError(70);
				}
			},
			major: (e) => e >> 8,
			minor: (e) => 255 & e,
			makedev: (e, r) => e << 8 | r,
			registerDevice(e, r) {
				ce.devices[e] = { stream_ops: r };
			},
			getDevice: (e) => ce.devices[e],
			getMounts(e) {
				for (var r = [], t = [e]; t.length;) {
					var a = t.pop();
					r.push(a), t.push.apply(t, a.mounts);
				}
				return r;
			},
			syncfs(e, r) {
				"function" == typeof e && (r = e, e = !1), ce.syncFSRequests++, ce.syncFSRequests > 1 && f(`warning: ${ce.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
				var t = ce.getMounts(ce.root.mount), a = 0;
				function n(e) {
					return ce.syncFSRequests--, r(e);
				}
				function o(e) {
					if (e) return o.errored ? void 0 : (o.errored = !0, n(e));
					++a >= t.length && n(null);
				}
				t.forEach((r) => {
					if (!r.type.syncfs) return o(null);
					r.type.syncfs(r, e, o);
				});
			},
			mount(e, r, t) {
				var a, n = "/" === t, o = !t;
				if (n && ce.root) throw new ce.ErrnoError(10);
				if (!n && !o) {
					var i = ce.lookupPath(t, { follow_mount: !1 });
					if (t = i.path, a = i.node, ce.isMountpoint(a)) throw new ce.ErrnoError(10);
					if (!ce.isDir(a.mode)) throw new ce.ErrnoError(54);
				}
				var s = {
					type: e,
					opts: r,
					mountpoint: t,
					mounts: []
				}, _ = e.mount(s);
				return _.mount = s, s.root = _, n ? ce.root = _ : a && (a.mounted = s, a.mount && a.mount.mounts.push(s)), _;
			},
			unmount(e) {
				var r = ce.lookupPath(e, { follow_mount: !1 });
				if (!ce.isMountpoint(r.node)) throw new ce.ErrnoError(28);
				var t = r.node, a = t.mounted, n = ce.getMounts(a);
				Object.keys(ce.nameTable).forEach((e) => {
					for (var r = ce.nameTable[e]; r;) {
						var t = r.name_next;
						n.includes(r.mount) && ce.destroyNode(r), r = t;
					}
				}), t.mounted = null;
				var o = t.mount.mounts.indexOf(a);
				t.mount.mounts.splice(o, 1);
			},
			lookup: (e, r) => e.node_ops.lookup(e, r),
			mknod(e, r, t) {
				var a = ce.lookupPath(e, { parent: !0 }).node, n = Z.basename(e);
				if (!n || "." === n || ".." === n) throw new ce.ErrnoError(28);
				var o = ce.mayCreate(a, n);
				if (o) throw new ce.ErrnoError(o);
				if (!a.node_ops.mknod) throw new ce.ErrnoError(63);
				return a.node_ops.mknod(a, n, r, t);
			},
			create: (e, r) => (r = void 0 !== r ? r : 438, r &= 4095, r |= 32768, ce.mknod(e, r, 0)),
			mkdir: (e, r) => (r = void 0 !== r ? r : 511, r &= 1023, r |= 16384, ce.mknod(e, r, 0)),
			mkdirTree(e, r) {
				for (var t = e.split("/"), a = "", n = 0; n < t.length; ++n) if (t[n]) {
					a += "/" + t[n];
					try {
						ce.mkdir(a, r);
					} catch (o) {
						if (20 != o.errno) throw o;
					}
				}
			},
			mkdev: (e, r, t) => (void 0 === t && (t = r, r = 438), r |= 8192, ce.mknod(e, r, t)),
			symlink(e, r) {
				if (!$.resolve(e)) throw new ce.ErrnoError(44);
				var t = ce.lookupPath(r, { parent: !0 }).node;
				if (!t) throw new ce.ErrnoError(44);
				var a = Z.basename(r), n = ce.mayCreate(t, a);
				if (n) throw new ce.ErrnoError(n);
				if (!t.node_ops.symlink) throw new ce.ErrnoError(63);
				return t.node_ops.symlink(t, a, e);
			},
			rename(e, r) {
				var t, a = Z.dirname(e), n = Z.dirname(r), o = Z.basename(e), i = Z.basename(r), s = ce.lookupPath(e, { parent: !0 }), _ = s.node;
				if (t = (s = ce.lookupPath(r, { parent: !0 })).node, !_ || !t) throw new ce.ErrnoError(44);
				if (_.mount !== t.mount) throw new ce.ErrnoError(75);
				var c, d = ce.lookupNode(_, o), p = $.relative(e, n);
				if ("." !== p.charAt(0)) throw new ce.ErrnoError(28);
				if ("." !== (p = $.relative(r, a)).charAt(0)) throw new ce.ErrnoError(55);
				try {
					c = ce.lookupNode(t, i);
				} catch (m) {}
				if (d !== c) {
					var l = ce.isDir(d.mode), u = ce.mayDelete(_, o, l);
					if (u) throw new ce.ErrnoError(u);
					if (u = c ? ce.mayDelete(t, i, l) : ce.mayCreate(t, i)) throw new ce.ErrnoError(u);
					if (!_.node_ops.rename) throw new ce.ErrnoError(63);
					if (ce.isMountpoint(d) || c && ce.isMountpoint(c)) throw new ce.ErrnoError(10);
					if (t !== _ && (u = ce.nodePermissions(_, "w"))) throw new ce.ErrnoError(u);
					ce.hashRemoveNode(d);
					try {
						_.node_ops.rename(d, t, i);
					} catch (m) {
						throw m;
					} finally {
						ce.hashAddNode(d);
					}
				}
			},
			rmdir(e) {
				var r = ce.lookupPath(e, { parent: !0 }).node, t = Z.basename(e), a = ce.lookupNode(r, t), n = ce.mayDelete(r, t, !0);
				if (n) throw new ce.ErrnoError(n);
				if (!r.node_ops.rmdir) throw new ce.ErrnoError(63);
				if (ce.isMountpoint(a)) throw new ce.ErrnoError(10);
				r.node_ops.rmdir(r, t), ce.destroyNode(a);
			},
			readdir(e) {
				var r = ce.lookupPath(e, { follow: !0 }).node;
				if (!r.node_ops.readdir) throw new ce.ErrnoError(54);
				return r.node_ops.readdir(r);
			},
			unlink(e) {
				var r = ce.lookupPath(e, { parent: !0 }).node;
				if (!r) throw new ce.ErrnoError(44);
				var t = Z.basename(e), a = ce.lookupNode(r, t), n = ce.mayDelete(r, t, !1);
				if (n) throw new ce.ErrnoError(n);
				if (!r.node_ops.unlink) throw new ce.ErrnoError(63);
				if (ce.isMountpoint(a)) throw new ce.ErrnoError(10);
				r.node_ops.unlink(r, t), ce.destroyNode(a);
			},
			readlink(e) {
				var r = ce.lookupPath(e).node;
				if (!r) throw new ce.ErrnoError(44);
				if (!r.node_ops.readlink) throw new ce.ErrnoError(28);
				return $.resolve(ce.getPath(r.parent), r.node_ops.readlink(r));
			},
			stat(e, r) {
				var t = ce.lookupPath(e, { follow: !r }).node;
				if (!t) throw new ce.ErrnoError(44);
				if (!t.node_ops.getattr) throw new ce.ErrnoError(63);
				return t.node_ops.getattr(t);
			},
			lstat: (e) => ce.stat(e, !0),
			chmod(e, r, t) {
				var a;
				if (!(a = "string" == typeof e ? ce.lookupPath(e, { follow: !t }).node : e).node_ops.setattr) throw new ce.ErrnoError(63);
				a.node_ops.setattr(a, {
					mode: 4095 & r | -4096 & a.mode,
					timestamp: Date.now()
				});
			},
			lchmod(e, r) {
				ce.chmod(e, r, !0);
			},
			fchmod(e, r) {
				var t = ce.getStreamChecked(e);
				ce.chmod(t.node, r);
			},
			chown(e, r, t, a) {
				var n;
				if (!(n = "string" == typeof e ? ce.lookupPath(e, { follow: !a }).node : e).node_ops.setattr) throw new ce.ErrnoError(63);
				n.node_ops.setattr(n, { timestamp: Date.now() });
			},
			lchown(e, r, t) {
				ce.chown(e, r, t, !0);
			},
			fchown(e, r, t) {
				var a = ce.getStreamChecked(e);
				ce.chown(a.node, r, t);
			},
			truncate(e, r) {
				if (r < 0) throw new ce.ErrnoError(28);
				var t;
				if (!(t = "string" == typeof e ? ce.lookupPath(e, { follow: !0 }).node : e).node_ops.setattr) throw new ce.ErrnoError(63);
				if (ce.isDir(t.mode)) throw new ce.ErrnoError(31);
				if (!ce.isFile(t.mode)) throw new ce.ErrnoError(28);
				var a = ce.nodePermissions(t, "w");
				if (a) throw new ce.ErrnoError(a);
				t.node_ops.setattr(t, {
					size: r,
					timestamp: Date.now()
				});
			},
			ftruncate(e, r) {
				var t = ce.getStreamChecked(e);
				if (!(2097155 & t.flags)) throw new ce.ErrnoError(28);
				ce.truncate(t.node, r);
			},
			utime(e, r, t) {
				var a = ce.lookupPath(e, { follow: !0 }).node;
				a.node_ops.setattr(a, { timestamp: Math.max(r, t) });
			},
			open(e, r, t) {
				if ("" === e) throw new ce.ErrnoError(44);
				var a;
				if (t = void 0 === t ? 438 : t, t = 64 & (r = "string" == typeof r ? ((e) => {
					var r = {
						r: 0,
						"r+": 2,
						w: 577,
						"w+": 578,
						a: 1089,
						"a+": 1090
					}[e];
					if (void 0 === r) throw new Error(`Unknown file open mode: ${e}`);
					return r;
				})(r) : r) ? 4095 & t | 32768 : 0, "object" == typeof e) a = e;
				else {
					e = Z.normalize(e);
					try {
						a = ce.lookupPath(e, { follow: !(131072 & r) }).node;
					} catch (_) {}
				}
				var o = !1;
				if (64 & r) if (a) {
					if (128 & r) throw new ce.ErrnoError(20);
				} else a = ce.mknod(e, t, 0), o = !0;
				if (!a) throw new ce.ErrnoError(44);
				if (ce.isChrdev(a.mode) && (r &= -513), 65536 & r && !ce.isDir(a.mode)) throw new ce.ErrnoError(54);
				if (!o) {
					var i = ce.mayOpen(a, r);
					if (i) throw new ce.ErrnoError(i);
				}
				512 & r && !o && ce.truncate(a, 0), r &= -131713;
				var s = ce.createStream({
					node: a,
					path: ce.getPath(a),
					flags: r,
					seekable: !0,
					position: 0,
					stream_ops: a.stream_ops,
					ungotten: [],
					error: !1
				});
				return s.stream_ops.open && s.stream_ops.open(s), !n.logReadFiles || 1 & r || (ce.readFiles || (ce.readFiles = {}), e in ce.readFiles || (ce.readFiles[e] = 1)), s;
			},
			close(e) {
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				e.getdents && (e.getdents = null);
				try {
					e.stream_ops.close && e.stream_ops.close(e);
				} catch (r) {
					throw r;
				} finally {
					ce.closeStream(e.fd);
				}
				e.fd = null;
			},
			isClosed: (e) => null === e.fd,
			llseek(e, r, t) {
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				if (!e.seekable || !e.stream_ops.llseek) throw new ce.ErrnoError(70);
				if (0 != t && 1 != t && 2 != t) throw new ce.ErrnoError(28);
				return e.position = e.stream_ops.llseek(e, r, t), e.ungotten = [], e.position;
			},
			read(e, r, t, a, n) {
				if (a < 0 || n < 0) throw new ce.ErrnoError(28);
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				if (1 == (2097155 & e.flags)) throw new ce.ErrnoError(8);
				if (ce.isDir(e.node.mode)) throw new ce.ErrnoError(31);
				if (!e.stream_ops.read) throw new ce.ErrnoError(28);
				var o = void 0 !== n;
				if (o) {
					if (!e.seekable) throw new ce.ErrnoError(70);
				} else n = e.position;
				var i = e.stream_ops.read(e, r, t, a, n);
				return o || (e.position += i), i;
			},
			write(e, r, t, a, n, o) {
				if (a < 0 || n < 0) throw new ce.ErrnoError(28);
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				if (!(2097155 & e.flags)) throw new ce.ErrnoError(8);
				if (ce.isDir(e.node.mode)) throw new ce.ErrnoError(31);
				if (!e.stream_ops.write) throw new ce.ErrnoError(28);
				e.seekable && 1024 & e.flags && ce.llseek(e, 0, 2);
				var i = void 0 !== n;
				if (i) {
					if (!e.seekable) throw new ce.ErrnoError(70);
				} else n = e.position;
				var s = e.stream_ops.write(e, r, t, a, n, o);
				return i || (e.position += s), s;
			},
			allocate(e, r, t) {
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				if (r < 0 || t <= 0) throw new ce.ErrnoError(28);
				if (!(2097155 & e.flags)) throw new ce.ErrnoError(8);
				if (!ce.isFile(e.node.mode) && !ce.isDir(e.node.mode)) throw new ce.ErrnoError(43);
				if (!e.stream_ops.allocate) throw new ce.ErrnoError(138);
				e.stream_ops.allocate(e, r, t);
			},
			mmap(e, r, t, a, n) {
				if (2 & a && !(2 & n) && 2 != (2097155 & e.flags)) throw new ce.ErrnoError(2);
				if (1 == (2097155 & e.flags)) throw new ce.ErrnoError(2);
				if (!e.stream_ops.mmap) throw new ce.ErrnoError(43);
				return e.stream_ops.mmap(e, r, t, a, n);
			},
			msync: (e, r, t, a, n) => e.stream_ops.msync ? e.stream_ops.msync(e, r, t, a, n) : 0,
			munmap: (e) => 0,
			ioctl(e, r, t) {
				if (!e.stream_ops.ioctl) throw new ce.ErrnoError(59);
				return e.stream_ops.ioctl(e, r, t);
			},
			readFile(e, r = {}) {
				if (r.flags = r.flags || 0, r.encoding = r.encoding || "binary", "utf8" !== r.encoding && "binary" !== r.encoding) throw new Error(`Invalid encoding type "${r.encoding}"`);
				var t, a = ce.open(e, r.flags), n = ce.stat(e).size, o = new Uint8Array(n);
				return ce.read(a, o, 0, n, 0), "utf8" === r.encoding ? t = J(o, 0) : "binary" === r.encoding && (t = o), ce.close(a), t;
			},
			writeFile(e, r, t = {}) {
				t.flags = t.flags || 577;
				var a = ce.open(e, t.flags, t.mode);
				if ("string" == typeof r) {
					var n = new Uint8Array(ee(r) + 1), o = re(r, n, 0, n.length);
					ce.write(a, n, 0, o, void 0, t.canOwn);
				} else {
					if (!ArrayBuffer.isView(r)) throw new Error("Unsupported data type");
					ce.write(a, r, 0, r.byteLength, void 0, t.canOwn);
				}
				ce.close(a);
			},
			cwd: () => ce.currentPath,
			chdir(e) {
				var r = ce.lookupPath(e, { follow: !0 });
				if (null === r.node) throw new ce.ErrnoError(44);
				if (!ce.isDir(r.node.mode)) throw new ce.ErrnoError(54);
				var t = ce.nodePermissions(r.node, "x");
				if (t) throw new ce.ErrnoError(t);
				ce.currentPath = r.path;
			},
			createDefaultDirectories() {
				ce.mkdir("/tmp"), ce.mkdir("/home"), ce.mkdir("/home/web_user");
			},
			createDefaultDevices() {
				ce.mkdir("/dev"), ce.registerDevice(ce.makedev(1, 3), {
					read: () => 0,
					write: (e, r, t, a, n) => a
				}), ce.mkdev("/dev/null", ce.makedev(1, 3)), ne.register(ce.makedev(5, 0), ne.default_tty_ops), ne.register(ce.makedev(6, 0), ne.default_tty1_ops), ce.mkdev("/dev/tty", ce.makedev(5, 0)), ce.mkdev("/dev/tty1", ce.makedev(6, 0));
				var e = new Uint8Array(1024), r = 0, t = () => (0 === r && (r = V(e).byteLength), e[--r]);
				ce.createDevice("/dev", "random", t), ce.createDevice("/dev", "urandom", t), ce.mkdir("/dev/shm"), ce.mkdir("/dev/shm/tmp");
			},
			createSpecialDirectories() {
				ce.mkdir("/proc");
				var e = ce.mkdir("/proc/self");
				ce.mkdir("/proc/self/fd"), ce.mount({ mount() {
					var r = ce.createNode(e, "fd", 16895, 73);
					return r.node_ops = { lookup(e, r) {
						var t = +r, a = ce.getStreamChecked(t), n = {
							parent: null,
							mount: { mountpoint: "fake" },
							node_ops: { readlink: () => a.path }
						};
						return n.parent = n, n;
					} }, r;
				} }, {}, "/proc/self/fd");
			},
			createStandardStreams() {
				n.stdin ? ce.createDevice("/dev", "stdin", n.stdin) : ce.symlink("/dev/tty", "/dev/stdin"), n.stdout ? ce.createDevice("/dev", "stdout", null, n.stdout) : ce.symlink("/dev/tty", "/dev/stdout"), n.stderr ? ce.createDevice("/dev", "stderr", null, n.stderr) : ce.symlink("/dev/tty1", "/dev/stderr"), ce.open("/dev/stdin", 0), ce.open("/dev/stdout", 1), ce.open("/dev/stderr", 1);
			},
			staticInit() {
				[44].forEach((e) => {
					ce.genericErrors[e] = new ce.ErrnoError(e), ce.genericErrors[e].stack = "<generic error, no stack>";
				}), ce.nameTable = new Array(4096), ce.mount(ie, {}, "/"), ce.createDefaultDirectories(), ce.createDefaultDevices(), ce.createSpecialDirectories(), ce.filesystems = { MEMFS: ie };
			},
			init(e, r, t) {
				ce.init.initialized = !0, n.stdin = e || n.stdin, n.stdout = r || n.stdout, n.stderr = t || n.stderr, ce.createStandardStreams();
			},
			quit() {
				ce.init.initialized = !1;
				for (var e = 0; e < ce.streams.length; e++) {
					var r = ce.streams[e];
					r && ce.close(r);
				}
			},
			findObject(e, r) {
				var t = ce.analyzePath(e, r);
				return t.exists ? t.object : null;
			},
			analyzePath(e, r) {
				try {
					e = (a = ce.lookupPath(e, { follow: !r })).path;
				} catch (n) {}
				var t = {
					isRoot: !1,
					exists: !1,
					error: 0,
					name: null,
					path: null,
					object: null,
					parentExists: !1,
					parentPath: null,
					parentObject: null
				};
				try {
					var a = ce.lookupPath(e, { parent: !0 });
					t.parentExists = !0, t.parentPath = a.path, t.parentObject = a.node, t.name = Z.basename(e), a = ce.lookupPath(e, { follow: !r }), t.exists = !0, t.path = a.path, t.object = a.node, t.name = a.node.name, t.isRoot = "/" === a.path;
				} catch (n) {
					t.error = n.errno;
				}
				return t;
			},
			createPath(e, r, t, a) {
				e = "string" == typeof e ? e : ce.getPath(e);
				for (var n = r.split("/").reverse(); n.length;) {
					var o = n.pop();
					if (o) {
						var i = Z.join2(e, o);
						try {
							ce.mkdir(i);
						} catch (s) {}
						e = i;
					}
				}
				return i;
			},
			createFile(e, r, t, a, n) {
				var o = Z.join2("string" == typeof e ? e : ce.getPath(e), r), i = _e(a, n);
				return ce.create(o, i);
			},
			createDataFile(e, r, t, a, n, o) {
				var i = r;
				e && (e = "string" == typeof e ? e : ce.getPath(e), i = r ? Z.join2(e, r) : e);
				var s = _e(a, n), _ = ce.create(i, s);
				if (t) {
					if ("string" == typeof t) {
						for (var c = new Array(t.length), d = 0, p = t.length; d < p; ++d) c[d] = t.charCodeAt(d);
						t = c;
					}
					ce.chmod(_, 146 | s);
					var l = ce.open(_, 577);
					ce.write(l, t, 0, t.length, 0, o), ce.close(l), ce.chmod(_, s);
				}
			},
			createDevice(e, r, t, a) {
				var n = Z.join2("string" == typeof e ? e : ce.getPath(e), r), o = _e(!!t, !!a);
				ce.createDevice.major || (ce.createDevice.major = 64);
				var i = ce.makedev(ce.createDevice.major++, 0);
				return ce.registerDevice(i, {
					open(e) {
						e.seekable = !1;
					},
					close(e) {
						a?.buffer?.length && a(10);
					},
					read(e, r, a, n, o) {
						for (var i = 0, s = 0; s < n; s++) {
							var _;
							try {
								_ = t();
							} catch (c) {
								throw new ce.ErrnoError(29);
							}
							if (void 0 === _ && 0 === i) throw new ce.ErrnoError(6);
							if (null == _) break;
							i++, r[a + s] = _;
						}
						return i && (e.node.timestamp = Date.now()), i;
					},
					write(e, r, t, n, o) {
						for (var i = 0; i < n; i++) try {
							a(r[t + i]);
						} catch (s) {
							throw new ce.ErrnoError(29);
						}
						return n && (e.node.timestamp = Date.now()), i;
					}
				}), ce.mkdev(n, o, i);
			},
			forceLoadFile(e) {
				if (e.isDevice || e.isFolder || e.link || e.contents) return !0;
				if ("undefined" != typeof XMLHttpRequest) throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
				if (!o) throw new Error("Cannot load without read() or XMLHttpRequest.");
				try {
					e.contents = te(o(e.url), !0), e.usedBytes = e.contents.length;
				} catch (r) {
					throw new ce.ErrnoError(29);
				}
			},
			createLazyFile(e, r, t, a, n) {
				function o() {
					this.lengthKnown = !1, this.chunks = [];
				}
				if (o.prototype.get = function(e) {
					if (!(e > this.length - 1 || e < 0)) {
						var r = e % this.chunkSize, t = e / this.chunkSize | 0;
						return this.getter(t)[r];
					}
				}, o.prototype.setDataGetter = function(e) {
					this.getter = e;
				}, o.prototype.cacheLength = function() {
					var e = new XMLHttpRequest();
					if (e.open("HEAD", t, !1), e.send(null), !(e.status >= 200 && e.status < 300 || 304 === e.status)) throw new Error("Couldn't load " + t + ". Status: " + e.status);
					var r, a = Number(e.getResponseHeader("Content-length")), n = (r = e.getResponseHeader("Accept-Ranges")) && "bytes" === r, o = (r = e.getResponseHeader("Content-Encoding")) && "gzip" === r, i = 1048576;
					n || (i = a);
					var s = this;
					s.setDataGetter((e) => {
						var r = e * i, n = (e + 1) * i - 1;
						if (n = Math.min(n, a - 1), void 0 === s.chunks[e] && (s.chunks[e] = ((e, r) => {
							if (e > r) throw new Error("invalid range (" + e + ", " + r + ") or no bytes requested!");
							if (r > a - 1) throw new Error("only " + a + " bytes available! programmer error!");
							var n = new XMLHttpRequest();
							if (n.open("GET", t, !1), a !== i && n.setRequestHeader("Range", "bytes=" + e + "-" + r), n.responseType = "arraybuffer", n.overrideMimeType && n.overrideMimeType("text/plain; charset=x-user-defined"), n.send(null), !(n.status >= 200 && n.status < 300 || 304 === n.status)) throw new Error("Couldn't load " + t + ". Status: " + n.status);
							return void 0 !== n.response ? new Uint8Array(n.response || []) : te(n.responseText || "", !0);
						})(r, n)), void 0 === s.chunks[e]) throw new Error("doXHR failed!");
						return s.chunks[e];
					}), !o && a || (i = a = 1, a = this.getter(0).length, i = a, m("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = a, this._chunkSize = i, this.lengthKnown = !0;
				}, "undefined" != typeof XMLHttpRequest) {
					var i = new o();
					Object.defineProperties(i, {
						length: { get: function() {
							return this.lengthKnown || this.cacheLength(), this._length;
						} },
						chunkSize: { get: function() {
							return this.lengthKnown || this.cacheLength(), this._chunkSize;
						} }
					});
					var s = {
						isDevice: !1,
						contents: i
					};
				} else s = {
					isDevice: !1,
					url: t
				};
				var _ = ce.createFile(e, r, s, a, n);
				s.contents ? _.contents = s.contents : s.url && (_.contents = null, _.url = s.url), Object.defineProperties(_, { usedBytes: { get: function() {
					return this.contents.length;
				} } });
				var c = {};
				function d(e, r, t, a, n) {
					var o = e.node.contents;
					if (n >= o.length) return 0;
					var i = Math.min(o.length - n, a);
					if (o.slice) for (var s = 0; s < i; s++) r[t + s] = o[n + s];
					else for (s = 0; s < i; s++) r[t + s] = o.get(n + s);
					return i;
				}
				return Object.keys(_.stream_ops).forEach((e) => {
					var r = _.stream_ops[e];
					c[e] = function() {
						return ce.forceLoadFile(_), r.apply(null, arguments);
					};
				}), c.read = (e, r, t, a, n) => (ce.forceLoadFile(_), d(e, r, t, a, n)), c.mmap = (e, r, t, a, n) => {
					ce.forceLoadFile(_);
					var o = oe();
					if (!o) throw new ce.ErrnoError(48);
					return d(e, g, o, r, t), {
						ptr: o,
						allocated: !0
					};
				}, _.stream_ops = c, _;
			}
		}, de = (e, r) => e ? J(v, e, r) : "", pe = {
			DEFAULT_POLLMASK: 5,
			calculateAt(e, r, t) {
				if (Z.isAbs(r)) return r;
				var a;
				if (a = -100 === e ? ce.cwd() : pe.getStreamFromFD(e).path, 0 == r.length) {
					if (!t) throw new ce.ErrnoError(44);
					return a;
				}
				return Z.join2(a, r);
			},
			doStat(e, r, t) {
				var a = e(r);
				k[t >> 2] = a.dev, k[t + 4 >> 2] = a.mode, b[t + 8 >> 2] = a.nlink, k[t + 12 >> 2] = a.uid, k[t + 16 >> 2] = a.gid, k[t + 20 >> 2] = a.rdev, U = [a.size >>> 0, (B = a.size, +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[t + 24 >> 2] = U[0], k[t + 28 >> 2] = U[1], k[t + 32 >> 2] = 4096, k[t + 36 >> 2] = a.blocks;
				var n = a.atime.getTime(), o = a.mtime.getTime(), i = a.ctime.getTime();
				return U = [Math.floor(n / 1e3) >>> 0, (B = Math.floor(n / 1e3), +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[t + 40 >> 2] = U[0], k[t + 44 >> 2] = U[1], b[t + 48 >> 2] = n % 1e3 * 1e3, U = [Math.floor(o / 1e3) >>> 0, (B = Math.floor(o / 1e3), +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[t + 56 >> 2] = U[0], k[t + 60 >> 2] = U[1], b[t + 64 >> 2] = o % 1e3 * 1e3, U = [Math.floor(i / 1e3) >>> 0, (B = Math.floor(i / 1e3), +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[t + 72 >> 2] = U[0], k[t + 76 >> 2] = U[1], b[t + 80 >> 2] = i % 1e3 * 1e3, U = [a.ino >>> 0, (B = a.ino, +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[t + 88 >> 2] = U[0], k[t + 92 >> 2] = U[1], 0;
			},
			doMsync(e, r, t, a, n) {
				if (!ce.isFile(r.node.mode)) throw new ce.ErrnoError(43);
				if (2 & a) return 0;
				var o = v.slice(e, e + t);
				ce.msync(r, o, n, t, a);
			},
			varargs: void 0,
			get() {
				var e = k[+pe.varargs >> 2];
				return pe.varargs += 4, e;
			},
			getp: () => pe.get(),
			getStr: (e) => de(e),
			getStreamFromFD: (e) => ce.getStreamChecked(e)
		}, le = (e, r, t) => re(e, v, r, t), ue = (e, r) => r + 2097152 >>> 0 < 4194305 - !!e ? (e >>> 0) + 4294967296 * r : NaN, me = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), fe = [
			0,
			31,
			60,
			91,
			121,
			152,
			182,
			213,
			244,
			274,
			305,
			335
		], he = [
			0,
			31,
			59,
			90,
			120,
			151,
			181,
			212,
			243,
			273,
			304,
			334
		], ge = (e) => {
			var r = ee(e) + 1, t = Qe(r);
			return t && le(e, t, r), t;
		}, ve = (e) => {
			if (e instanceof H || "unwind" == e) return h;
			d(1, e);
		}, we = () => X || !1, ye = (e, r) => {
			var t;
			h = e, h = t = e, we() || (n.onExit?.(t), x = !0), d(t, new H(t));
		}, ke = (e) => {
			if (!x) try {
				e(), (() => {
					if (!we()) try {
						ye(h);
					} catch (e) {
						ve(e);
					}
				})();
			} catch (r) {
				ve(r);
			}
		}, be = (e, r) => setTimeout(() => {
			ke(e);
		}, r), Ee = (e, r) => {
			if (xe.mainLoop.timingMode = e, xe.mainLoop.timingValue = r, !xe.mainLoop.func) return 1;
			if (xe.mainLoop.running || (xe.mainLoop.running = !0), 0 == e) xe.mainLoop.scheduler = function() {
				var e = 0 | Math.max(0, xe.mainLoop.tickStartTime + r - ze());
				setTimeout(xe.mainLoop.runner, e);
			}, xe.mainLoop.method = "timeout";
			else if (1 == e) xe.mainLoop.scheduler = function() {
				xe.requestAnimationFrame(xe.mainLoop.runner);
			}, xe.mainLoop.method = "rAF";
			else if (2 == e) {
				if (void 0 === xe.setImmediate) if ("undefined" == typeof setImmediate) {
					var t = [], a = "setimmediate";
					addEventListener("message", (e) => {
						e.data !== a && e.data.target !== a || (e.stopPropagation(), t.shift()());
					}, !0), xe.setImmediate = function(e) {
						t.push(e), void 0 === n.setImmediates && (n.setImmediates = []), n.setImmediates.push(e), postMessage({ target: a });
					};
				} else xe.setImmediate = setImmediate;
				xe.mainLoop.scheduler = function() {
					xe.setImmediate(xe.mainLoop.runner);
				}, xe.mainLoop.method = "immediate";
			}
			return 0;
		}, ze = () => performance.now(), xe = {
			mainLoop: {
				running: !1,
				scheduler: null,
				method: "",
				currentlyRunningMainloop: 0,
				func: null,
				arg: 0,
				timingMode: 0,
				timingValue: 0,
				currentFrameNumber: 0,
				queue: [],
				pause() {
					xe.mainLoop.scheduler = null, xe.mainLoop.currentlyRunningMainloop++;
				},
				resume() {
					xe.mainLoop.currentlyRunningMainloop++;
					var e = xe.mainLoop.timingMode, r = xe.mainLoop.timingValue, t = xe.mainLoop.func;
					xe.mainLoop.func = null, ((e, r, t, a, n) => {
						L(!xe.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters."), xe.mainLoop.func = e, xe.mainLoop.arg = a;
						var o = xe.mainLoop.currentlyRunningMainloop;
						function i() {
							return !(o < xe.mainLoop.currentlyRunningMainloop);
						}
						if (xe.mainLoop.running = !1, xe.mainLoop.runner = function() {
							if (!x) if (xe.mainLoop.queue.length > 0) {
								var r = xe.mainLoop.queue.shift();
								if (r.func(r.arg), xe.mainLoop.remainingBlockers) {
									var t = xe.mainLoop.remainingBlockers, a = t % 1 == 0 ? t - 1 : Math.floor(t);
									r.counted ? xe.mainLoop.remainingBlockers = a : (a += .5, xe.mainLoop.remainingBlockers = (8 * t + a) / 9);
								}
								if (xe.mainLoop.updateStatus(), !i()) return;
								setTimeout(xe.mainLoop.runner, 0);
							} else i() && (xe.mainLoop.currentFrameNumber = xe.mainLoop.currentFrameNumber + 1 | 0, 1 == xe.mainLoop.timingMode && xe.mainLoop.timingValue > 1 && xe.mainLoop.currentFrameNumber % xe.mainLoop.timingValue != 0 ? xe.mainLoop.scheduler() : (0 == xe.mainLoop.timingMode && (xe.mainLoop.tickStartTime = ze()), xe.mainLoop.runIter(e), i() && ("object" == typeof SDL && SDL.audio?.queueNewAudioData?.(), xe.mainLoop.scheduler())));
						}, n || (r && r > 0 ? Ee(0, 1e3 / r) : Ee(1, 1), xe.mainLoop.scheduler()), t) throw "unwind";
					})(t, 0, !1, xe.mainLoop.arg, !0), Ee(e, r), xe.mainLoop.scheduler();
				},
				updateStatus() {
					if (n.setStatus) {
						var e = n.statusMessage || "Please wait...", r = xe.mainLoop.remainingBlockers, t = xe.mainLoop.expectedBlockers;
						r ? r < t ? n.setStatus(e + " (" + (t - r) + "/" + t + ")") : n.setStatus(e) : n.setStatus("");
					}
				},
				runIter(e) {
					x || n.preMainLoop && !1 === n.preMainLoop() || (ke(e), n.postMainLoop?.());
				}
			},
			isFullscreen: !1,
			pointerLock: !1,
			moduleContextCreatedCallbacks: [],
			workers: [],
			init() {
				if (!xe.initted) {
					xe.initted = !0;
					se.push({
						canHandle: function(e) {
							return !n.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(e);
						},
						handle: function(e, r, t, a) {
							var n = new Blob([e], { type: xe.getMimetype(r) });
							n.size !== e.length && (n = new Blob([new Uint8Array(e).buffer], { type: xe.getMimetype(r) }));
							var o = URL.createObjectURL(n), i = new Image();
							i.onload = () => {
								L(i.complete, `Image ${r} could not be decoded`);
								var a = document.createElement("canvas");
								a.width = i.width, a.height = i.height, a.getContext("2d").drawImage(i, 0, 0), Ze[r] = a, URL.revokeObjectURL(o), t?.(e);
							}, i.onerror = (e) => {
								f(`Image ${o} could not be decoded`), a?.();
							}, i.src = o;
						}
					});
					se.push({
						canHandle: function(e) {
							return !n.noAudioDecoding && e.substr(-4) in {
								".ogg": 1,
								".wav": 1,
								".mp3": 1
							};
						},
						handle: function(e, r, t, a) {
							var n = !1;
							function o(a) {
								n || (n = !0, Ve[r] = a, t?.(e));
							}
							var i = new Blob([e], { type: xe.getMimetype(r) }), s = URL.createObjectURL(i), _ = new Audio();
							_.addEventListener("canplaythrough", () => o(_), !1), _.onerror = function(t) {
								n || (f(`warning: browser could not fully decode audio ${r}, trying slower base64 approach`), _.src = "data:audio/x-" + r.substr(-3) + ";base64," + function(e) {
									for (var r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", t = "", a = 0, n = 0, o = 0; o < e.length; o++) for (a = a << 8 | e[o], n += 8; n >= 6;) {
										var i = a >> n - 6 & 63;
										n -= 6, t += r[i];
									}
									return 2 == n ? (t += r[(3 & a) << 4], t += "==") : 4 == n && (t += r[(15 & a) << 2], t += "="), t;
								}(e), o(_));
							}, _.src = s, be(() => {
								o(_);
							}, 1e4);
						}
					});
					var t = n.canvas;
					t && (t.requestPointerLock = t.requestPointerLock || t.mozRequestPointerLock || t.webkitRequestPointerLock || t.msRequestPointerLock || (() => {}), t.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock || document.msExitPointerLock || (() => {}), t.exitPointerLock = t.exitPointerLock.bind(document), document.addEventListener("pointerlockchange", a, !1), document.addEventListener("mozpointerlockchange", a, !1), document.addEventListener("webkitpointerlockchange", a, !1), document.addEventListener("mspointerlockchange", a, !1), n.elementPointerLock && t.addEventListener("click", (e) => {
						!xe.pointerLock && n.canvas.requestPointerLock && (n.canvas.requestPointerLock(), e.preventDefault());
					}, !1));
				}
				function a() {
					xe.pointerLock = document.pointerLockElement === n.canvas || document.mozPointerLockElement === n.canvas || document.webkitPointerLockElement === n.canvas || document.msPointerLockElement === n.canvas;
				}
			},
			createContext(e, r, t, a) {
				if (r && n.ctx && e == n.canvas) return n.ctx;
				var o, i;
				if (r) {
					var s = {
						antialias: !1,
						alpha: !1,
						majorVersion: 1
					};
					if (a) for (var _ in a) s[_] = a[_];
					void 0 !== Oe && (i = Oe.createContext(e, s)) && (o = Oe.getContext(i).GLctx);
				} else o = e.getContext("2d");
				return o ? (t && (r || L(void 0 === Xe, "cannot set in module if GLctx is used, but we are a non-GL context that would replace it"), n.ctx = o, r && Oe.makeContextCurrent(i), n.useWebGL = r, xe.moduleContextCreatedCallbacks.forEach((e) => e()), xe.init()), o) : null;
			},
			destroyContext(e, r, t) {},
			fullscreenHandlersInstalled: !1,
			lockPointer: void 0,
			resizeCanvas: void 0,
			requestFullscreen(e, r) {
				xe.lockPointer = e, xe.resizeCanvas = r, void 0 === xe.lockPointer && (xe.lockPointer = !0), void 0 === xe.resizeCanvas && (xe.resizeCanvas = !1);
				var t = n.canvas;
				function a() {
					xe.isFullscreen = !1;
					var e = t.parentNode;
					(document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === e ? (t.exitFullscreen = xe.exitFullscreen, xe.lockPointer && t.requestPointerLock(), xe.isFullscreen = !0, xe.resizeCanvas ? xe.setFullscreenCanvasSize() : xe.updateCanvasDimensions(t)) : (e.parentNode.insertBefore(t, e), e.parentNode.removeChild(e), xe.resizeCanvas ? xe.setWindowedCanvasSize() : xe.updateCanvasDimensions(t)), n.onFullScreen?.(xe.isFullscreen), n.onFullscreen?.(xe.isFullscreen);
				}
				xe.fullscreenHandlersInstalled || (xe.fullscreenHandlersInstalled = !0, document.addEventListener("fullscreenchange", a, !1), document.addEventListener("mozfullscreenchange", a, !1), document.addEventListener("webkitfullscreenchange", a, !1), document.addEventListener("MSFullscreenChange", a, !1));
				var o = document.createElement("div");
				t.parentNode.insertBefore(o, t), o.appendChild(t), o.requestFullscreen = o.requestFullscreen || o.mozRequestFullScreen || o.msRequestFullscreen || (o.webkitRequestFullscreen ? () => o.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) : null) || (o.webkitRequestFullScreen ? () => o.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : null), o.requestFullscreen();
			},
			exitFullscreen: () => !!xe.isFullscreen && ((document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen || document.webkitCancelFullScreen || (() => {})).apply(document, []), !0),
			nextRAF: 0,
			fakeRequestAnimationFrame(e) {
				var r = Date.now();
				if (0 === xe.nextRAF) xe.nextRAF = r + 1e3 / 60;
				else for (; r + 2 >= xe.nextRAF;) xe.nextRAF += 1e3 / 60;
				var t = Math.max(xe.nextRAF - r, 0);
				setTimeout(e, t);
			},
			requestAnimationFrame(e) {
				"function" != typeof requestAnimationFrame ? (0, xe.fakeRequestAnimationFrame)(e) : requestAnimationFrame(e);
			},
			safeSetTimeout: (e, r) => be(e, r),
			safeRequestAnimationFrame: (e) => xe.requestAnimationFrame(() => {
				ke(e);
			}),
			getMimetype: (e) => ({
				jpg: "image/jpeg",
				jpeg: "image/jpeg",
				png: "image/png",
				bmp: "image/bmp",
				ogg: "audio/ogg",
				wav: "audio/wav",
				mp3: "audio/mpeg"
			})[e.substr(e.lastIndexOf(".") + 1)],
			getUserMedia(e) {
				window.getUserMedia ||= navigator.getUserMedia || navigator.mozGetUserMedia, window.getUserMedia(e);
			},
			getMovementX: (e) => e.movementX || e.mozMovementX || e.webkitMovementX || 0,
			getMovementY: (e) => e.movementY || e.mozMovementY || e.webkitMovementY || 0,
			getMouseWheelDelta(e) {
				var r = 0;
				switch (e.type) {
					case "DOMMouseScroll":
						r = e.detail / 3;
						break;
					case "mousewheel":
						r = e.wheelDelta / 120;
						break;
					case "wheel":
						switch (r = e.deltaY, e.deltaMode) {
							case 0:
								r /= 100;
								break;
							case 1:
								r /= 3;
								break;
							case 2:
								r *= 80;
								break;
							default: throw "unrecognized mouse wheel delta mode: " + e.deltaMode;
						}
						break;
					default: throw "unrecognized mouse wheel event: " + e.type;
				}
				return r;
			},
			mouseX: 0,
			mouseY: 0,
			mouseMovementX: 0,
			mouseMovementY: 0,
			touches: {},
			lastTouches: {},
			calculateMouseCoords(e, r) {
				var t = n.canvas.getBoundingClientRect(), a = n.canvas.width, o = n.canvas.height, i = void 0 !== window.scrollX ? window.scrollX : window.pageXOffset, s = void 0 !== window.scrollY ? window.scrollY : window.pageYOffset, _ = e - (i + t.left), c = r - (s + t.top);
				return {
					x: _ *= a / t.width,
					y: c *= o / t.height
				};
			},
			setMouseCoords(e, r) {
				const { x: t, y: a } = xe.calculateMouseCoords(e, r);
				xe.mouseMovementX = t - xe.mouseX, xe.mouseMovementY = a - xe.mouseY, xe.mouseX = t, xe.mouseY = a;
			},
			calculateMouseEvent(e) {
				if (xe.pointerLock) "mousemove" != e.type && "mozMovementX" in e ? xe.mouseMovementX = xe.mouseMovementY = 0 : (xe.mouseMovementX = xe.getMovementX(e), xe.mouseMovementY = xe.getMovementY(e)), "undefined" != typeof SDL ? (xe.mouseX = SDL.mouseX + xe.mouseMovementX, xe.mouseY = SDL.mouseY + xe.mouseMovementY) : (xe.mouseX += xe.mouseMovementX, xe.mouseY += xe.mouseMovementY);
				else {
					if ("touchstart" === e.type || "touchend" === e.type || "touchmove" === e.type) {
						var r = e.touch;
						if (void 0 === r) return;
						var t = xe.calculateMouseCoords(r.pageX, r.pageY);
						if ("touchstart" === e.type) xe.lastTouches[r.identifier] = t, xe.touches[r.identifier] = t;
						else if ("touchend" === e.type || "touchmove" === e.type) {
							var a = xe.touches[r.identifier];
							a ||= t, xe.lastTouches[r.identifier] = a, xe.touches[r.identifier] = t;
						}
						return;
					}
					xe.setMouseCoords(e.pageX, e.pageY);
				}
			},
			resizeListeners: [],
			updateResizeListeners() {
				var e = n.canvas;
				xe.resizeListeners.forEach((r) => r(e.width, e.height));
			},
			setCanvasSize(e, r, t) {
				var a = n.canvas;
				xe.updateCanvasDimensions(a, e, r), t || xe.updateResizeListeners();
			},
			windowedWidth: 0,
			windowedHeight: 0,
			setFullscreenCanvasSize() {
				if ("undefined" != typeof SDL) {
					var e = b[SDL.screen >> 2];
					e |= 8388608, k[SDL.screen >> 2] = e;
				}
				xe.updateCanvasDimensions(n.canvas), xe.updateResizeListeners();
			},
			setWindowedCanvasSize() {
				if ("undefined" != typeof SDL) {
					var e = b[SDL.screen >> 2];
					e &= -8388609, k[SDL.screen >> 2] = e;
				}
				xe.updateCanvasDimensions(n.canvas), xe.updateResizeListeners();
			},
			updateCanvasDimensions(e, r, t) {
				r && t ? (e.widthNative = r, e.heightNative = t) : (r = e.widthNative, t = e.heightNative);
				var a = r, o = t;
				if (n.forcedAspectRatio && n.forcedAspectRatio > 0 && (a / o < n.forcedAspectRatio ? a = Math.round(o * n.forcedAspectRatio) : o = Math.round(a / n.forcedAspectRatio)), (document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === e.parentNode && "undefined" != typeof screen) {
					var i = Math.min(screen.width / a, screen.height / o);
					a = Math.round(a * i), o = Math.round(o * i);
				}
				xe.resizeCanvas ? (e.width != a && (e.width = a), e.height != o && (e.height = o), void 0 !== e.style && (e.style.removeProperty("width"), e.style.removeProperty("height"))) : (e.width != r && (e.width = r), e.height != t && (e.height = t), void 0 !== e.style && (a != r || o != t ? (e.style.setProperty("width", a + "px", "important"), e.style.setProperty("height", o + "px", "important")) : (e.style.removeProperty("width"), e.style.removeProperty("height"))));
			}
		}, Le = [], Se = (e) => {
			var r = Le[e];
			return r || (e >= Le.length && (Le.length = e + 1), Le[e] = r = ae.get(e)), r;
		}, Me = (e) => {
			var r = (e - u.buffer.byteLength + 65535) / 65536;
			try {
				return u.grow(r), S(), 1;
			} catch (t) {}
		};
		class Fe {
			constructor() {
				this.allocated = [void 0], this.freelist = [];
			}
			get(e) {
				return this.allocated[e];
			}
			has(e) {
				return void 0 !== this.allocated[e];
			}
			allocate(e) {
				var r = this.freelist.pop() || this.allocated.length;
				return this.allocated[r] = e, r;
			}
			free(e) {
				this.allocated[e] = void 0, this.freelist.push(e);
			}
		}
		var De = {
			openDatabase(e, r, t, a) {
				try {
					var n = indexedDB.open(e, r);
				} catch (o) {
					return a(o);
				}
				n.onupgradeneeded = (e) => {
					var r = e.target.result;
					r.objectStoreNames.contains("FILES") && r.deleteObjectStore("FILES"), r.createObjectStore("FILES");
				}, n.onsuccess = (e) => t(e.target.result), n.onerror = a;
			},
			init() {
				De.xhrs = new Fe(), I(), De.openDatabase("emscripten_filesystem", 1, (e) => {
					De.dbInstance = e, N();
				}, () => {
					De.dbInstance = !1, N();
				});
			}
		};
		function Pe(e, r, t, a, n) {
			var o = b[e + 8 >> 2];
			if (o) {
				var i = de(o), s = e + 112, _ = de(s + 0);
				_ ||= "GET";
				var c = b[s + 56 >> 2], d = b[s + 68 >> 2], p = b[s + 72 >> 2], l = b[s + 76 >> 2], u = b[s + 80 >> 2], m = b[s + 84 >> 2], f = b[s + 88 >> 2], h = b[s + 52 >> 2], g = !!(1 & h), w = !!(2 & h), k = !!(64 & h), E = d ? de(d) : void 0, z = p ? de(p) : void 0, x = new XMLHttpRequest();
				if (x.withCredentials = !!v[s + 60 | 0], x.open(_, i, !k, E, z), k || (x.timeout = c), x.url_ = i, x.responseType = "arraybuffer", u) {
					var L = de(u);
					x.overrideMimeType(L);
				}
				if (l) for (;;) {
					var S = b[l >> 2];
					if (!S) break;
					var M = b[l + 4 >> 2];
					if (!M) break;
					l += 8;
					var F = de(S), D = de(M);
					x.setRequestHeader(F, D);
				}
				var P = De.xhrs.allocate(x);
				b[e >> 2] = P;
				var A = m && f ? v.slice(m, m + f) : null;
				x.onload = (a) => {
					De.xhrs.has(P) && (C(), x.status >= 200 && x.status < 300 ? r?.(e, x, a) : t?.(e, x, a));
				}, x.onerror = (r) => {
					De.xhrs.has(P) && (C(), t?.(e, x, r));
				}, x.ontimeout = (r) => {
					De.xhrs.has(P) && t?.(e, x, r);
				}, x.onprogress = (r) => {
					if (De.xhrs.has(P)) {
						var t = g && w && x.response ? x.response.byteLength : 0, n = 0;
						t > 0 && g && w && (n = Qe(t), v.set(new Uint8Array(x.response), n)), b[e + 12 >> 2] = n, Ae(e + 16, t), Ae(e + 24, r.loaded - t), Ae(e + 32, r.total), y[e + 40 >> 1] = x.readyState, x.readyState >= 3 && 0 === x.status && r.loaded > 0 && (x.status = 200), y[e + 42 >> 1] = x.status, x.statusText && le(x.statusText, e + 44, 64), a?.(e, x, r), n && Je(n);
					}
				}, x.onreadystatechange = (r) => {
					De.xhrs.has(P) && (y[e + 40 >> 1] = x.readyState, x.readyState >= 2 && (y[e + 42 >> 1] = x.status), n?.(e, x, r));
				};
				try {
					x.send(A);
				} catch (R) {
					t?.(e, x, R);
				}
			} else t(e, 0, "no url specified!");
			function C() {
				var r = 0, t = 0;
				x.response && g && 0 === b[e + 12 >> 2] && (t = x.response.byteLength), t > 0 && (r = Qe(t), v.set(new Uint8Array(x.response), r)), b[e + 12 >> 2] = r, Ae(e + 16, t), Ae(e + 24, 0);
				var a = x.response ? x.response.byteLength : 0;
				a && Ae(e + 32, a), y[e + 40 >> 1] = x.readyState, y[e + 42 >> 1] = x.status, x.statusText && le(x.statusText, e + 44, 64);
			}
		}
		var Ae = (e, r) => {
			b[e >> 2] = r;
			var t = b[e >> 2];
			b[e + 4 >> 2] = (r - t) / 4294967296;
		};
		function Ce(e, r, t, a, n) {
			if (e) {
				var o = b[r + 112 + 64 >> 2];
				o ||= b[r + 8 >> 2];
				var i = de(o);
				try {
					var s = e.transaction(["FILES"], "readwrite").objectStore("FILES").put(t, i);
					s.onsuccess = (e) => {
						y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, le("OK", r + 44, 64), a(r, 0, i);
					}, s.onerror = (e) => {
						y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 413, le("Payload Too Large", r + 44, 64), n(r, 0, e);
					};
				} catch (_) {
					n(r, 0, _);
				}
			} else n(r, 0, "IndexedDB not available!");
		}
		var Re = {}, Te = () => {
			if (!Te.strings) {
				var e = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
					_: c || "./this.program"
				};
				for (var r in Re) void 0 === Re[r] ? delete e[r] : e[r] = Re[r];
				var t = [];
				for (var r in e) t.push(`${r}=${e[r]}`);
				Te.strings = t;
			}
			return Te.strings;
		}, Oe = {
			counter: 1,
			buffers: [],
			programs: [],
			framebuffers: [],
			renderbuffers: [],
			textures: [],
			shaders: [],
			vaos: [],
			contexts: [],
			offscreenCanvases: {},
			queries: [],
			stringCache: {},
			unpackAlignment: 4,
			recordError: function(e) {
				Oe.lastError || (Oe.lastError = e);
			},
			getNewId: (e) => {
				for (var r = Oe.counter++, t = e.length; t < r; t++) e[t] = null;
				return r;
			},
			getSource: (e, r, t, a) => {
				for (var n = "", o = 0; o < r; ++o) {
					var i = a ? b[a + 4 * o >> 2] : void 0;
					n += de(b[t + 4 * o >> 2], i);
				}
				return n;
			},
			createContext: (e, r) => {
				e.getContextSafariWebGL2Fixed || (e.getContextSafariWebGL2Fixed = e.getContext, e.getContext = function(r, t) {
					var a = e.getContextSafariWebGL2Fixed(r, t);
					return "webgl" == r == a instanceof WebGLRenderingContext ? a : null;
				});
				var t = e.getContext("webgl", r);
				return t ? Oe.registerContext(t, r) : 0;
			},
			registerContext: (e, r) => {
				var t = Oe.getNewId(Oe.contexts), a = {
					handle: t,
					attributes: r,
					version: r.majorVersion,
					GLctx: e
				};
				return e.canvas && (e.canvas.GLctxObject = a), Oe.contexts[t] = a, (void 0 === r.enableExtensionsByDefault || r.enableExtensionsByDefault) && Oe.initExtensions(a), t;
			},
			makeContextCurrent: (e) => (Oe.currentContext = Oe.contexts[e], n.ctx = Xe = Oe.currentContext?.GLctx, !(e && !Xe)),
			getContext: (e) => Oe.contexts[e],
			deleteContext: (e) => {
				Oe.currentContext === Oe.contexts[e] && (Oe.currentContext = null), "object" == typeof JSEvents && JSEvents.removeAllHandlersOnTarget(Oe.contexts[e].GLctx.canvas), Oe.contexts[e] && Oe.contexts[e].GLctx.canvas && (Oe.contexts[e].GLctx.canvas.GLctxObject = void 0), Oe.contexts[e] = null;
			},
			initExtensions: (e) => {
				if (e ||= Oe.currentContext, !e.initExtensionsDone) {
					e.initExtensionsDone = !0;
					var r = e.GLctx;
					((e) => {
						var r = e.getExtension("ANGLE_instanced_arrays");
						r && (e.vertexAttribDivisor = (e, t) => r.vertexAttribDivisorANGLE(e, t), e.drawArraysInstanced = (e, t, a, n) => r.drawArraysInstancedANGLE(e, t, a, n), e.drawElementsInstanced = (e, t, a, n, o) => r.drawElementsInstancedANGLE(e, t, a, n, o));
					})(r), ((e) => {
						var r = e.getExtension("OES_vertex_array_object");
						r && (e.createVertexArray = () => r.createVertexArrayOES(), e.deleteVertexArray = (e) => r.deleteVertexArrayOES(e), e.bindVertexArray = (e) => r.bindVertexArrayOES(e), e.isVertexArray = (e) => r.isVertexArrayOES(e));
					})(r), ((e) => {
						var r = e.getExtension("WEBGL_draw_buffers");
						r && (e.drawBuffers = (e, t) => r.drawBuffersWEBGL(e, t));
					})(r), r.disjointTimerQueryExt = r.getExtension("EXT_disjoint_timer_query"), ((e) => {
						e.multiDrawWebgl = e.getExtension("WEBGL_multi_draw");
					})(r), function(e) {
						var r = [
							"ANGLE_instanced_arrays",
							"EXT_blend_minmax",
							"EXT_disjoint_timer_query",
							"EXT_frag_depth",
							"EXT_shader_texture_lod",
							"EXT_sRGB",
							"OES_element_index_uint",
							"OES_fbo_render_mipmap",
							"OES_standard_derivatives",
							"OES_texture_float",
							"OES_texture_half_float",
							"OES_texture_half_float_linear",
							"OES_vertex_array_object",
							"WEBGL_color_buffer_float",
							"WEBGL_depth_texture",
							"WEBGL_draw_buffers",
							"EXT_color_buffer_half_float",
							"EXT_float_blend",
							"EXT_texture_compression_bptc",
							"EXT_texture_compression_rgtc",
							"EXT_texture_filter_anisotropic",
							"KHR_parallel_shader_compile",
							"OES_texture_float_linear",
							"WEBGL_compressed_texture_s3tc",
							"WEBGL_compressed_texture_s3tc_srgb",
							"WEBGL_debug_renderer_info",
							"WEBGL_debug_shaders",
							"WEBGL_lose_context",
							"WEBGL_multi_draw"
						];
						return (e.getSupportedExtensions() || []).filter((e) => r.includes(e));
					}(r).forEach((e) => {
						e.includes("lose_context") || e.includes("debug") || r.getExtension(e);
					});
				}
			}
		}, Ie = (e, r, t, a, n, o) => {
			var i = ((e) => 1 == (e -= 5120) ? v : 4 == e ? k : 6 == e ? E : 5 == e || 28922 == e ? b : y)(e), s = ((e) => 31 - Math.clz32(e.BYTES_PER_ELEMENT))(i), _ = 1 << s, c = ((e, r, t, a) => {
				return r * (e * t + (n = a) - 1 & -n);
				var n;
			})(t, a, ((e) => ({
				5: 3,
				6: 4,
				8: 2,
				29502: 3,
				29504: 4
			})[e - 6402] || 1)(r) * _, Oe.unpackAlignment);
			return i.subarray(n >> s, n + c >> s);
		}, Ne = [
			31,
			29,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31
		], je = [
			31,
			28,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31
		], qe = (e, r) => {
			g.set(e, r);
		}, Be = (e, r, t, a) => {
			var n = b[a + 40 >> 2], o = {
				tm_sec: k[a >> 2],
				tm_min: k[a + 4 >> 2],
				tm_hour: k[a + 8 >> 2],
				tm_mday: k[a + 12 >> 2],
				tm_mon: k[a + 16 >> 2],
				tm_year: k[a + 20 >> 2],
				tm_wday: k[a + 24 >> 2],
				tm_yday: k[a + 28 >> 2],
				tm_isdst: k[a + 32 >> 2],
				tm_gmtoff: k[a + 36 >> 2],
				tm_zone: n ? de(n) : ""
			}, i = de(t), s = {
				"%c": "%a %b %d %H:%M:%S %Y",
				"%D": "%m/%d/%y",
				"%F": "%Y-%m-%d",
				"%h": "%b",
				"%r": "%I:%M:%S %p",
				"%R": "%H:%M",
				"%T": "%H:%M:%S",
				"%x": "%m/%d/%y",
				"%X": "%H:%M:%S",
				"%Ec": "%c",
				"%EC": "%C",
				"%Ex": "%m/%d/%y",
				"%EX": "%H:%M:%S",
				"%Ey": "%y",
				"%EY": "%Y",
				"%Od": "%d",
				"%Oe": "%e",
				"%OH": "%H",
				"%OI": "%I",
				"%Om": "%m",
				"%OM": "%M",
				"%OS": "%S",
				"%Ou": "%u",
				"%OU": "%U",
				"%OV": "%V",
				"%Ow": "%w",
				"%OW": "%W",
				"%Oy": "%y"
			};
			for (var _ in s) i = i.replace(new RegExp(_, "g"), s[_]);
			var c = [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday"
			], d = [
				"January",
				"February",
				"March",
				"April",
				"May",
				"June",
				"July",
				"August",
				"September",
				"October",
				"November",
				"December"
			];
			function p(e, r, t) {
				for (var a = "number" == typeof e ? e.toString() : e || ""; a.length < r;) a = t[0] + a;
				return a;
			}
			function l(e, r) {
				return p(e, r, "0");
			}
			function u(e, r) {
				function t(e) {
					return e < 0 ? -1 : e > 0 ? 1 : 0;
				}
				var a;
				return 0 === (a = t(e.getFullYear() - r.getFullYear())) && 0 === (a = t(e.getMonth() - r.getMonth())) && (a = t(e.getDate() - r.getDate())), a;
			}
			function m(e) {
				switch (e.getDay()) {
					case 0: return new Date(e.getFullYear() - 1, 11, 29);
					case 1: return e;
					case 2: return new Date(e.getFullYear(), 0, 3);
					case 3: return new Date(e.getFullYear(), 0, 2);
					case 4: return new Date(e.getFullYear(), 0, 1);
					case 5: return new Date(e.getFullYear() - 1, 11, 31);
					case 6: return new Date(e.getFullYear() - 1, 11, 30);
				}
			}
			function f(e) {
				var r = ((e, r) => {
					for (var t = new Date(e.getTime()); r > 0;) {
						var a = me(t.getFullYear()), n = t.getMonth(), o = (a ? Ne : je)[n];
						if (!(r > o - t.getDate())) return t.setDate(t.getDate() + r), t;
						r -= o - t.getDate() + 1, t.setDate(1), n < 11 ? t.setMonth(n + 1) : (t.setMonth(0), t.setFullYear(t.getFullYear() + 1));
					}
					return t;
				})(new Date(e.tm_year + 1900, 0, 1), e.tm_yday), t = new Date(r.getFullYear(), 0, 4), a = new Date(r.getFullYear() + 1, 0, 4), n = m(t), o = m(a);
				return u(n, r) <= 0 ? u(o, r) <= 0 ? r.getFullYear() + 1 : r.getFullYear() : r.getFullYear() - 1;
			}
			var h = {
				"%a": (e) => c[e.tm_wday].substring(0, 3),
				"%A": (e) => c[e.tm_wday],
				"%b": (e) => d[e.tm_mon].substring(0, 3),
				"%B": (e) => d[e.tm_mon],
				"%C": (e) => l((e.tm_year + 1900) / 100 | 0, 2),
				"%d": (e) => l(e.tm_mday, 2),
				"%e": (e) => p(e.tm_mday, 2, " "),
				"%g": (e) => f(e).toString().substring(2),
				"%G": f,
				"%H": (e) => l(e.tm_hour, 2),
				"%I": (e) => {
					var r = e.tm_hour;
					return 0 == r ? r = 12 : r > 12 && (r -= 12), l(r, 2);
				},
				"%j": (e) => l(e.tm_mday + ((e, r) => {
					for (var t = 0, a = 0; a <= r; t += e[a++]);
					return t;
				})(me(e.tm_year + 1900) ? Ne : je, e.tm_mon - 1), 3),
				"%m": (e) => l(e.tm_mon + 1, 2),
				"%M": (e) => l(e.tm_min, 2),
				"%n": () => "\n",
				"%p": (e) => e.tm_hour >= 0 && e.tm_hour < 12 ? "AM" : "PM",
				"%S": (e) => l(e.tm_sec, 2),
				"%t": () => "	",
				"%u": (e) => e.tm_wday || 7,
				"%U": (e) => {
					var r = e.tm_yday + 7 - e.tm_wday;
					return l(Math.floor(r / 7), 2);
				},
				"%V": (e) => {
					var r = Math.floor((e.tm_yday + 7 - (e.tm_wday + 6) % 7) / 7);
					if ((e.tm_wday + 371 - e.tm_yday - 2) % 7 <= 2 && r++, r) {
						if (53 == r) {
							var t = (e.tm_wday + 371 - e.tm_yday) % 7;
							4 == t || 3 == t && me(e.tm_year) || (r = 1);
						}
					} else {
						r = 52;
						var a = (e.tm_wday + 7 - e.tm_yday - 1) % 7;
						(4 == a || 5 == a && me(e.tm_year % 400 - 1)) && r++;
					}
					return l(r, 2);
				},
				"%w": (e) => e.tm_wday,
				"%W": (e) => {
					var r = e.tm_yday + 7 - (e.tm_wday + 6) % 7;
					return l(Math.floor(r / 7), 2);
				},
				"%y": (e) => (e.tm_year + 1900).toString().substring(2),
				"%Y": (e) => e.tm_year + 1900,
				"%z": (e) => {
					var r = e.tm_gmtoff, t = r >= 0;
					return r = (r = Math.abs(r) / 60) / 60 * 100 + r % 60, (t ? "+" : "-") + String("0000" + r).slice(-4);
				},
				"%Z": (e) => e.tm_zone,
				"%%": () => "%"
			};
			for (var _ in i = i.replace(/%%/g, "\0\0"), h) i.includes(_) && (i = i.replace(new RegExp(_, "g"), h[_](o)));
			var g = te(i = i.replace(/\0\0/g, "%"), !1);
			return g.length > r ? 0 : (qe(g, e), g.length - 1);
		}, Ue = (e) => n["_" + e], Ye = (e, r, t, a, n) => {
			var o = {
				string: (e) => {
					var r = 0;
					return null != e && 0 !== e && (r = ((e) => {
						var r = ee(e) + 1, t = nr(r);
						return le(e, t, r), t;
					})(e)), r;
				},
				array: (e) => {
					var r = nr(e.length);
					return qe(e, r), r;
				}
			}, i = Ue(e), s = [], _ = 0;
			if (a) for (var c = 0; c < a.length; c++) {
				var d = o[t[c]];
				d ? (0 === _ && (_ = tr()), s[c] = d(a[c])) : s[c] = a[c];
			}
			var p = i.apply(null, s);
			return p = function(e) {
				return 0 !== _ && ar(_), function(e) {
					return "string" === r ? de(e) : "boolean" === r ? Boolean(e) : e;
				}(e);
			}(p);
		}, Ge = function(e, r, t, a) {
			e || (e = this), this.parent = e, this.mount = e.mount, this.mounted = null, this.id = ce.nextInode++, this.name = r, this.mode = t, this.node_ops = {}, this.stream_ops = {}, this.rdev = a;
		}, He = 365, We = 146;
		Object.defineProperties(Ge.prototype, {
			read: {
				get: function() {
					return (this.mode & He) === He;
				},
				set: function(e) {
					e ? this.mode |= He : this.mode &= -366;
				}
			},
			write: {
				get: function() {
					return (this.mode & We) === We;
				},
				set: function(e) {
					e ? this.mode |= We : this.mode &= -147;
				}
			},
			isFolder: { get: function() {
				return ce.isDir(this.mode);
			} },
			isDevice: { get: function() {
				return ce.isChrdev(this.mode);
			} }
		}), ce.FSNode = Ge, ce.createPreloadedFile = (e, r, t, a, n, o, s, _, c, d) => {
			var p = r ? $.resolve(Z.join2(e, r)) : e;
			function l(t) {
				function i(t) {
					d?.(), _ || ((e, r, t, a, n, o) => {
						ce.createDataFile(e, r, t, a, n, o);
					})(e, r, t, a, n, c), o?.(), N();
				}
				((e, r, t, a) => {
					void 0 !== xe && xe.init();
					var n = !1;
					return se.forEach((o) => {
						n || o.canHandle(r) && (o.handle(e, r, t, a), n = !0);
					}), n;
				})(t, p, i, () => {
					s?.(), N();
				}) || i(t);
			}
			I(), "string" == typeof t ? ((e, r, t, a) => {
				var n = a ? "" : `al ${e}`;
				i(e, (e) => {
					r(new Uint8Array(e)), n && N();
				}, (r) => {
					if (!t) throw `Loading data file "${e}" failed.`;
					t();
				}), n && I();
			})(t, l, s) : l(t);
		}, ce.staticInit(), n.requestFullscreen = xe.requestFullscreen, n.requestAnimationFrame = xe.requestAnimationFrame, n.setCanvasSize = xe.setCanvasSize, n.pauseMainLoop = xe.mainLoop.pause, n.resumeMainLoop = xe.mainLoop.resume, n.getUserMedia = xe.getUserMedia, n.createContext = xe.createContext;
		var Xe, Ze = {}, Ve = {};
		De.init();
		var $e = {
			a: function(e, r, t) {
				pe.varargs = t;
				try {
					var a = pe.getStreamFromFD(e);
					switch (r) {
						case 0:
							if ((n = pe.get()) < 0) return -28;
							for (; ce.streams[n];) n++;
							return ce.createStream(a, n).fd;
						case 1:
						case 2:
						case 13:
						case 14: return 0;
						case 3: return a.flags;
						case 4:
							var n = pe.get();
							return a.flags |= n, 0;
						case 12: return n = pe.getp(), w[n + 0 >> 1] = 2, 0;
					}
					return -28;
				} catch (o) {
					if (void 0 === ce || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			A: function(e, r, t) {
				try {
					var a = pe.getStreamFromFD(e);
					a.getdents ||= ce.readdir(a.path);
					for (var n = 280, o = 0, i = ce.llseek(a, 0, 1), s = Math.floor(i / n); s < a.getdents.length && o + n <= t;) {
						var _, c, d = a.getdents[s];
						if ("." === d) _ = a.node.id, c = 4;
						else if (".." === d) _ = ce.lookupPath(a.path, { parent: !0 }).node.id, c = 4;
						else {
							var p = ce.lookupNode(a.node, d);
							_ = p.id, c = ce.isChrdev(p.mode) ? 2 : ce.isDir(p.mode) ? 4 : ce.isLink(p.mode) ? 10 : 8;
						}
						U = [_ >>> 0, (B = _, +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[r + o >> 2] = U[0], k[r + o + 4 >> 2] = U[1], U = [(s + 1) * n >>> 0, (B = (s + 1) * n, +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[r + o + 8 >> 2] = U[0], k[r + o + 12 >> 2] = U[1], w[r + o + 16 >> 1] = 280, g[r + o + 18 | 0] = c, le(d, r + o + 19, 256), o += n, s += 1;
					}
					return ce.llseek(a, s * n, 0), o;
				} catch (l) {
					if (void 0 === ce || "ErrnoError" !== l.name) throw l;
					return -l.errno;
				}
			},
			H: function(e, r, t) {
				pe.varargs = t;
				try {
					var a = pe.getStreamFromFD(e);
					switch (r) {
						case 21509:
						case 21510:
						case 21511:
						case 21512:
						case 21524:
						case 21515: return a.tty ? 0 : -59;
						case 21505:
							if (!a.tty) return -59;
							if (a.tty.ops.ioctl_tcgets) {
								var n = a.tty.ops.ioctl_tcgets(a), o = pe.getp();
								k[o >> 2] = n.c_iflag || 0, k[o + 4 >> 2] = n.c_oflag || 0, k[o + 8 >> 2] = n.c_cflag || 0, k[o + 12 >> 2] = n.c_lflag || 0;
								for (var i = 0; i < 32; i++) g[o + i + 17 | 0] = n.c_cc[i] || 0;
								return 0;
							}
							return 0;
						case 21506:
						case 21507:
						case 21508:
							if (!a.tty) return -59;
							if (a.tty.ops.ioctl_tcsets) {
								o = pe.getp();
								var s = k[o >> 2], _ = k[o + 4 >> 2], c = k[o + 8 >> 2], d = k[o + 12 >> 2], p = [];
								for (i = 0; i < 32; i++) p.push(g[o + i + 17 | 0]);
								return a.tty.ops.ioctl_tcsets(a.tty, r, {
									c_iflag: s,
									c_oflag: _,
									c_cflag: c,
									c_lflag: d,
									c_cc: p
								});
							}
							return 0;
						case 21519: return a.tty ? (o = pe.getp(), k[o >> 2] = 0, 0) : -59;
						case 21520: return a.tty ? -28 : -59;
						case 21531: return o = pe.getp(), ce.ioctl(a, r, o);
						case 21523:
							if (!a.tty) return -59;
							if (a.tty.ops.ioctl_tiocgwinsz) {
								var l = a.tty.ops.ioctl_tiocgwinsz(a.tty);
								o = pe.getp(), w[o >> 1] = l[0], w[o + 2 >> 1] = l[1];
							}
							return 0;
						default: return -28;
					}
				} catch (u) {
					if (void 0 === ce || "ErrnoError" !== u.name) throw u;
					return -u.errno;
				}
			},
			i: function(e, r, t, a) {
				pe.varargs = a;
				try {
					r = pe.getStr(r), r = pe.calculateAt(e, r);
					var n = a ? pe.get() : 0;
					return ce.open(r, t, n).fd;
				} catch (o) {
					if (void 0 === ce || "ErrnoError" !== o.name) throw o;
					return -o.errno;
				}
			},
			y: function(e, r, t, a) {
				try {
					if (r = pe.getStr(r), r = pe.calculateAt(e, r), a <= 0) return -28;
					var n = ce.readlink(r), o = Math.min(a, ee(n)), i = g[t + o];
					return le(n, t, a + 1), g[t + o] = i, o;
				} catch (s) {
					if (void 0 === ce || "ErrnoError" !== s.name) throw s;
					return -s.errno;
				}
			},
			D: function(e, r) {
				try {
					return e = pe.getStr(e), pe.doStat(ce.stat, e, r);
				} catch (t) {
					if (void 0 === ce || "ErrnoError" !== t.name) throw t;
					return -t.errno;
				}
			},
			z: function(e, r) {
				try {
					return e = pe.getStr(e), r = pe.getStr(r), ce.symlink(e, r), 0;
				} catch (t) {
					if (void 0 === ce || "ErrnoError" !== t.name) throw t;
					return -t.errno;
				}
			},
			w: function(e, r, t) {
				try {
					return r = pe.getStr(r), r = pe.calculateAt(e, r), 0 === t ? ce.unlink(r) : 512 === t ? ce.rmdir(r) : j("Invalid flags passed to unlinkat"), 0;
				} catch (a) {
					if (void 0 === ce || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			I: function(e) {
				if (De.xhrs.has(e)) {
					var r = De.xhrs.get(e);
					De.xhrs.free(e), r.readyState > 0 && r.readyState < 4 && r.abort();
				}
			},
			F: () => 1,
			q: function(e, r, t) {
				var a = ue(e, r), n = /* @__PURE__ */ new Date(1e3 * a);
				k[t >> 2] = n.getUTCSeconds(), k[t + 4 >> 2] = n.getUTCMinutes(), k[t + 8 >> 2] = n.getUTCHours(), k[t + 12 >> 2] = n.getUTCDate(), k[t + 16 >> 2] = n.getUTCMonth(), k[t + 20 >> 2] = n.getUTCFullYear() - 1900, k[t + 24 >> 2] = n.getUTCDay();
				var o = Date.UTC(n.getUTCFullYear(), 0, 1, 0, 0, 0, 0), i = (n.getTime() - o) / 864e5 | 0;
				k[t + 28 >> 2] = i;
			},
			r: function(e, r, t) {
				var a = ue(e, r), n = /* @__PURE__ */ new Date(1e3 * a);
				k[t >> 2] = n.getSeconds(), k[t + 4 >> 2] = n.getMinutes(), k[t + 8 >> 2] = n.getHours(), k[t + 12 >> 2] = n.getDate(), k[t + 16 >> 2] = n.getMonth(), k[t + 20 >> 2] = n.getFullYear() - 1900, k[t + 24 >> 2] = n.getDay();
				var o = 0 | ((e) => (me(e.getFullYear()) ? fe : he)[e.getMonth()] + e.getDate() - 1)(n);
				k[t + 28 >> 2] = o, k[t + 36 >> 2] = -60 * n.getTimezoneOffset();
				var i = new Date(n.getFullYear(), 0, 1), s = new Date(n.getFullYear(), 6, 1).getTimezoneOffset(), _ = i.getTimezoneOffset(), c = 0 | (s != _ && n.getTimezoneOffset() == Math.min(_, s));
				k[t + 32 >> 2] = c;
			},
			x: (e, r, t) => {
				var a = (/* @__PURE__ */ new Date()).getFullYear(), n = new Date(a, 0, 1), o = new Date(a, 6, 1), i = n.getTimezoneOffset(), s = o.getTimezoneOffset(), _ = Math.max(i, s);
				function c(e) {
					var r = e.toTimeString().match(/\(([A-Za-z ]+)\)$/);
					return r ? r[1] : "GMT";
				}
				b[e >> 2] = 60 * _, k[r >> 2] = Number(i != s);
				var d = c(n), p = c(o), l = ge(d), u = ge(p);
				s < i ? (b[t >> 2] = l, b[t + 4 >> 2] = u) : (b[t >> 2] = u, b[t + 4 >> 2] = l);
			},
			b: () => {
				j("");
			},
			n: function() {
				self.postMessage({ t: "gfx" });
			},
			p: function() {
				var e = new URL(location.origin).hostname;
				if (0 === e.length && (e = new URL(location.href.replace("blob:", "")).hostname), /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(e)) 0 === e.indexOf("10.") && (e = "10.*"), 0 === e.indexOf("192.168.") && (e = "192.168.*"), 0 === e.indexOf("172.") && (e = "172.*"), 0 === e.indexOf("127.") && (e = "127.*");
				else {
					var r = new RegExp("(" + String.fromCharCode(92) + ".ngrok\\.io)$", "i");
					r.test(e) && (e = "*.ngrok.io"), (r = new RegExp("(" + String.fromCharCode(92) + ".ngrok-free\\.app)$", "i")).test(e) && (e = "*.ngrok.io"), (r = new RegExp("(" + String.fromCharCode(92) + ".arweb\\.app)$", "i")).test(e) && (e = "*.arweb.app");
				}
				var t = ee(e) + 1, a = Qe(t);
				return le(e, a, t + 1), a;
			},
			o: function() {
				self.postMessage({ t: "licerr" });
			},
			h: (e, r, t) => {
				function a() {
					Se(e)(r);
				}
				t >= 0 ? be(a, t) : xe.safeRequestAnimationFrame(a);
			},
			f: () => Date.now(),
			t: () => 2147483648,
			E: ze,
			K: () => !1,
			G: (e, r, t) => v.copyWithin(e, r, r + t),
			v: (e) => {
				var r = v.length, t = 2147483648;
				if ((e >>>= 0) > t) return !1;
				for (var a = (e, r) => e + (r - e % r) % r, n = 1; n <= 4; n *= 2) {
					var o = r * (1 + .2 / n);
					if (o = Math.min(o, e + 100663296), Me(Math.min(t, a(Math.max(e, o), 65536)))) return !0;
				}
				return !1;
			},
			J: function(e, r, t, a, n) {
				var o = e + 112, i = b[o + 36 >> 2], s = b[o + 40 >> 2], _ = b[o + 44 >> 2], c = b[o + 48 >> 2], d = b[o + 52 >> 2], p = !!(64 & d);
				function l(e) {
					p ? e() : ke(e);
				}
				var u = (e, t, a) => {
					l(() => {
						i ? Se(i)(e) : r?.(e);
					});
				}, m = (e, r, t) => {
					l(() => {
						_ ? Se(_)(e) : a?.(e);
					});
				}, f = (e, r, a) => {
					l(() => {
						s ? Se(s)(e) : t?.(e);
					});
				}, h = (e, r, t) => {
					l(() => {
						c ? Se(c)(e) : n?.(e);
					});
				}, g = (e, t, a) => {
					Ce(De.dbInstance, e, t.response, (e, t, a) => {
						l(() => {
							i ? Se(i)(e) : r?.(e);
						});
					}, (e, t, a) => {
						l(() => {
							i ? Se(i)(e) : r?.(e);
						});
					});
				}, w = de(o + 0), k = !!(16 & d), E = !!(4 & d), z = !!(32 & d);
				if ("EM_IDB_STORE" === w) {
					var x = b[o + 84 >> 2], L = b[o + 88 >> 2];
					Ce(De.dbInstance, e, v.slice(x, x + L), u, f);
				} else if ("EM_IDB_DELETE" === w) (function(e, r, t, a) {
					if (e) {
						var n = b[r + 112 + 64 >> 2];
						n ||= b[r + 8 >> 2];
						var o = de(n);
						try {
							var i = e.transaction(["FILES"], "readwrite").objectStore("FILES").delete(o);
							i.onsuccess = (e) => {
								var a = e.target.result;
								b[r + 12 >> 2] = 0, Ae(r + 16, 0), Ae(r + 24, 0), Ae(r + 32, 0), y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, le("OK", r + 44, 64), t(r, 0, a);
							}, i.onerror = (e) => {
								y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, le("Not Found", r + 44, 64), a(r, 0, e);
							};
						} catch (s) {
							a(r, 0, s);
						}
					} else a(r, 0, "IndexedDB not available!");
				})(De.dbInstance, e, u, f);
				else if (k) {
					if (z) return 0;
					Pe(e, E ? g : u, f, m, h);
				} else (function(e, r, t, a) {
					if (e) {
						var n = b[r + 112 + 64 >> 2];
						n ||= b[r + 8 >> 2];
						var o = de(n);
						try {
							var i = e.transaction(["FILES"], "readonly").objectStore("FILES").get(o);
							i.onsuccess = (e) => {
								if (e.target.result) {
									var n = e.target.result, o = n.byteLength || n.length, i = Qe(o);
									v.set(new Uint8Array(n), i), b[r + 12 >> 2] = i, Ae(r + 16, o), Ae(r + 24, 0), Ae(r + 32, o), y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, le("OK", r + 44, 64), t(r, 0, n);
								} else y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, le("Not Found", r + 44, 64), a(r, 0, "no data");
							}, i.onerror = (e) => {
								y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, le("Not Found", r + 44, 64), a(r, 0, e);
							};
						} catch (s) {
							a(r, 0, s);
						}
					} else a(r, 0, "IndexedDB not available!");
				})(De.dbInstance, e, u, z ? f : E ? (e, r, t) => {
					Pe(e, g, f, m, h);
				} : (e, r, t) => {
					Pe(e, u, f, m, h);
				});
				return e;
			},
			B: (e, r) => {
				var t = 0;
				return Te().forEach((a, n) => {
					var o = r + t;
					b[e + 4 * n >> 2] = o, ((e, r) => {
						for (var t = 0; t < e.length; ++t) g[0 | r++] = e.charCodeAt(t);
						g[0 | r] = 0;
					})(a, o), t += a.length + 1;
				}), 0;
			},
			C: (e, r) => {
				var t = Te();
				b[e >> 2] = t.length;
				var a = 0;
				return t.forEach((e) => a += e.length + 1), b[r >> 2] = a, 0;
			},
			m: ye,
			c: function(e) {
				try {
					var r = pe.getStreamFromFD(e);
					return ce.close(r), 0;
				} catch (t) {
					if (void 0 === ce || "ErrnoError" !== t.name) throw t;
					return t.errno;
				}
			},
			j: function(e, r, t, a) {
				try {
					var n = ((e, r, t, a) => {
						for (var n = 0, o = 0; o < t; o++) {
							var i = b[r >> 2], s = b[r + 4 >> 2];
							r += 8;
							var _ = ce.read(e, g, i, s, a);
							if (_ < 0) return -1;
							if (n += _, _ < s) break;
							void 0 !== a && (a += _);
						}
						return n;
					})(pe.getStreamFromFD(e), r, t);
					return b[a >> 2] = n, 0;
				} catch (o) {
					if (void 0 === ce || "ErrnoError" !== o.name) throw o;
					return o.errno;
				}
			},
			s: function(e, r, t, a, n) {
				var o = ue(r, t);
				try {
					if (isNaN(o)) return 61;
					var i = pe.getStreamFromFD(e);
					return ce.llseek(i, o, a), U = [i.position >>> 0, (B = i.position, +Math.abs(B) >= 1 ? B > 0 ? +Math.floor(B / 4294967296) >>> 0 : ~~+Math.ceil((B - +(~~B >>> 0)) / 4294967296) >>> 0 : 0)], k[n >> 2] = U[0], k[n + 4 >> 2] = U[1], i.getdents && 0 === o && 0 === a && (i.getdents = null), 0;
				} catch (s) {
					if (void 0 === ce || "ErrnoError" !== s.name) throw s;
					return s.errno;
				}
			},
			g: function(e, r, t, a) {
				try {
					var n = ((e, r, t, a) => {
						for (var n = 0, o = 0; o < t; o++) {
							var i = b[r >> 2], s = b[r + 4 >> 2];
							r += 8;
							var _ = ce.write(e, g, i, s, a);
							if (_ < 0) return -1;
							n += _, void 0 !== a && (a += _);
						}
						return n;
					})(pe.getStreamFromFD(e), r, t);
					return b[a >> 2] = n, 0;
				} catch (o) {
					if (void 0 === ce || "ErrnoError" !== o.name) throw o;
					return o.errno;
				}
			},
			k: (e, r) => {
				Xe.bindTexture(e, Oe.textures[r]);
			},
			l: (e, r) => {
				((e, r, t, a) => {
					for (var n = 0; n < e; n++) {
						var o = Xe[t](), i = o && Oe.getNewId(a);
						o ? (o.name = i, a[i] = o) : Oe.recordError(1282), k[r + 4 * n >> 2] = i;
					}
				})(e, r, "createTexture", Oe.textures);
			},
			d: (e, r, t, a, n, o, i, s, _) => {
				Xe.texImage2D(e, r, t, a, n, o, i, s, _ ? Ie(s, i, a, n, _) : null);
			},
			e: function(e, r, t) {
				Xe.texParameteri(e, r, t);
			},
			u: (e, r, t, a, n) => Be(e, r, t, a)
		}, Ke = function() {
			var e = { a: $e };
			function r(e, r) {
				var t;
				return Ke = e.exports, u = Ke.L, S(), ae = Ke.Q, t = Ke.M, F.unshift(t), N(), Ke;
			}
			if (I(), n.instantiateWasm) try {
				return n.instantiateWasm(e, r);
			} catch (t) {
				f(`Module.instantiateWasm callback failed with error: ${t}`), a(t);
			}
			return r(G(Y, e)[0]);
		}();
		Ke.M, n._zappar_has_initialized = Ke.N, n._zappar_invert = Ke.O, n._zappar_loaded = Ke.P, n._zappar_pipeline_create = Ke.R, n._zappar_pipeline_destroy = Ke.S, n._zappar_pipeline_camera_frame_submit = Ke.T, n._zappar_pipeline_camera_frame_submit_raw_pointer = Ke.U, n._zappar_pipeline_frame_update = Ke.V, n._zappar_pipeline_camera_frame_user_data = Ke.W, n._zappar_pipeline_camera_model = Ke.X, n._zappar_pipeline_camera_data_width = Ke.Y, n._zappar_pipeline_camera_data_height = Ke.Z, n._zappar_pipeline_camera_frame_sharpness = Ke._, n._zappar_pipeline_camera_frame_sharpness_enabled_set = Ke.$, n._zappar_pipeline_frame_number = Ke.aa, n._zappar_pipeline_camera_frame_data_raw_size = Ke.ba, n._zappar_pipeline_camera_frame_data_raw = Ke.ca, n._zappar_pipeline_motion_accelerometer_submit = Ke.da, n._zappar_pipeline_motion_accelerometer_with_gravity_submit_int = Ke.ea, n._zappar_pipeline_motion_accelerometer_without_gravity_submit_int = Ke.fa, n._zappar_pipeline_motion_rotation_rate_submit_int = Ke.ga, n._zappar_pipeline_motion_attitude_submit_int = Ke.ha, n._zappar_pipeline_motion_relative_orientation_submit_int = Ke.ia, n._zappar_pipeline_motion_rotation_rate_submit = Ke.ja, n._zappar_pipeline_motion_attitude_submit = Ke.ka, n._zappar_pipeline_motion_attitude_matrix_submit = Ke.la, n._zappar_pipeline_camera_frame_user_facing = Ke.ma, n._zappar_pipeline_camera_frame_texture_matrix = Ke.na, n._zappar_pipeline_camera_pose_with_attitude = Ke.oa, n._zappar_pipeline_camera_pose_with_origin = Ke.pa, n._zappar_pipeline_camera_frame_camera_attitude = Ke.qa, n._zappar_pipeline_camera_frame_device_attitude = Ke.ra, n._zappar_pipeline_camera_frame_texture_gl = Ke.sa, n._zappar_pipeline_camera_frame_upload_gl = Ke.ta, n._zappar_pipeline_sequence_record_start = Ke.ua, n._zappar_pipeline_sequence_record_stop = Ke.va, n._zappar_pipeline_sequence_record_clear = Ke.wa, n._zappar_pipeline_sequence_record_device_attitude_matrices_set = Ke.xa, n._zappar_pipeline_sequence_record_data_size = Ke.ya, n._zappar_pipeline_sequence_record_data = Ke.za, n._zappar_pipeline_process_gl = Ke.Aa, n._zappar_pipeline_camera_pose_default = Ke.Ba, n._zappar_instant_world_tracker_create = Ke.Ca, n._zappar_instant_world_tracker_destroy = Ke.Da, n._zappar_instant_world_tracker_anchor_pose_set_from_camera_offset_raw = Ke.Ea, n._zappar_instant_world_tracker_anchor_pose_raw = Ke.Fa, n._zappar_instant_world_tracker_enabled_set = Ke.Ga, n._zappar_instant_world_tracker_enabled = Ke.Ha, n._zappar_custom_anchor_create = Ke.Ia, n._zappar_custom_anchor_destroy = Ke.Ja, n._zappar_custom_anchor_pose_set_from_camera_offset_raw = Ke.Ka, n._zappar_custom_anchor_pose_set_from_anchor_offset = Ke.La, n._zappar_custom_anchor_pose_set_with_parent = Ke.Ma, n._zappar_custom_anchor_pose_set = Ke.Na, n._zappar_custom_anchor_pose_version = Ke.Oa, n._zappar_custom_anchor_pose_raw = Ke.Pa, n._zappar_custom_anchor_id = Ke.Qa, n._zappar_custom_anchor_status = Ke.Ra, n._zappar_image_tracker_create = Ke.Sa, n._zappar_image_tracker_destroy = Ke.Ta, n._zappar_image_tracker_target_load_from_memory = Ke.Ua, n.__Z42zappar_image_tracker_target_load_from_fileP23zappar_image_tracker_tiPKc = Ke.Va;
		var Je = n._free = Ke.Wa;
		n._zappar_image_tracker_anchor_count = Ke.Xa, n._zappar_image_tracker_anchor_id = Ke.Ya, n._zappar_image_tracker_anchor_pose_raw = Ke.Za, n._zappar_image_tracker_enabled_set = Ke._a, n._zappar_image_tracker_enabled = Ke.$a, n._zappar_image_tracker_target_loaded_version = Ke.ab, n.__Z33zappar_image_tracker_target_countP23zappar_image_tracker_ti = Ke.bb, n.__Z46zappar_image_tracker_target_preview_compressedP23zappar_image_tracker_tii = Ke.cb, n.__Z51zappar_image_tracker_target_preview_compressed_sizeP23zappar_image_tracker_tii = Ke.db, n.__Z55zappar_image_tracker_target_preview_compressed_mimetypeP23zappar_image_tracker_tii = Ke.eb, n.__Z40zappar_image_tracker_target_preview_rgbaP23zappar_image_tracker_tii = Ke.fb, n.__Z45zappar_image_tracker_target_preview_rgba_sizeP23zappar_image_tracker_tii = Ke.gb, n.__Z46zappar_image_tracker_target_preview_rgba_widthP23zappar_image_tracker_tii = Ke.hb, n.__Z47zappar_image_tracker_target_preview_rgba_heightP23zappar_image_tracker_tii = Ke.ib, n.__Z38zappar_image_tracker_target_radius_topP23zappar_image_tracker_tii = Ke.jb, n.__Z41zappar_image_tracker_target_radius_bottomP23zappar_image_tracker_tii = Ke.kb, n.__Z39zappar_image_tracker_target_side_lengthP23zappar_image_tracker_tii = Ke.lb, n.__Z49zappar_image_tracker_target_physical_scale_factorP23zappar_image_tracker_tii = Ke.mb, n.__Z49zappar_image_tracker_target_preview_mesh_verticesP23zappar_image_tracker_tii = Ke.nb, n.__Z48zappar_image_tracker_target_preview_mesh_normalsP23zappar_image_tracker_tii = Ke.ob, n.__Z44zappar_image_tracker_target_preview_mesh_uvsP23zappar_image_tracker_tii = Ke.pb, n.__Z48zappar_image_tracker_target_preview_mesh_indicesP23zappar_image_tracker_tii = Ke.qb, n.__Z54zappar_image_tracker_target_preview_mesh_vertices_sizeP23zappar_image_tracker_tii = Ke.rb, n.__Z53zappar_image_tracker_target_preview_mesh_normals_sizeP23zappar_image_tracker_tii = Ke.sb, n.__Z49zappar_image_tracker_target_preview_mesh_uvs_sizeP23zappar_image_tracker_tii = Ke.tb, n.__Z53zappar_image_tracker_target_preview_mesh_indices_sizeP23zappar_image_tracker_tii = Ke.ub, n.__Z32zappar_image_tracker_target_typeP23zappar_image_tracker_tii = Ke.vb, n._zappar_face_tracker_create = Ke.wb, n._zappar_face_tracker_destroy = Ke.xb, n._zappar_face_tracker_model_load_from_memory = Ke.yb, n._zappar_face_tracker_anchor_count = Ke.zb, n._zappar_face_tracker_anchor_id = Ke.Ab, n._zappar_face_tracker_anchor_pose_raw = Ke.Bb, n._zappar_face_tracker_anchor_identity_coefficients = Ke.Cb, n._zappar_face_tracker_anchor_expression_coefficients = Ke.Db, n._zappar_face_tracker_enabled_set = Ke.Eb, n._zappar_face_tracker_enabled = Ke.Fb, n._zappar_face_tracker_max_faces_set = Ke.Gb, n._zappar_face_tracker_max_faces = Ke.Hb, n._zappar_face_tracker_model_loaded_version = Ke.Ib, n._zappar_face_landmark_create = Ke.Jb, n._zappar_face_landmark_destroy = Ke.Kb, n.__Z27zappar_face_landmark_updateP23zappar_face_landmark_tiPKfS2_i = Ke.Lb, n._zappar_face_landmark_anchor_pose = Ke.Mb, n._zappar_barcode_finder_create = Ke.Nb, n._zappar_barcode_finder_destroy = Ke.Ob, n._zappar_barcode_finder_found_number = Ke.Pb, n._zappar_barcode_finder_found_text = Ke.Qb, n._zappar_barcode_finder_enabled_set = Ke.Rb, n._zappar_barcode_finder_enabled = Ke.Sb, n._zappar_barcode_finder_found_format = Ke.Tb, n._zappar_barcode_finder_formats = Ke.Ub, n._zappar_barcode_finder_formats_set = Ke.Vb, n._zappar_zapcode_tracker_create = Ke.Wb, n._zappar_zapcode_tracker_destroy = Ke.Xb, n._zappar_zapcode_tracker_target_load_from_memory = Ke.Yb, n.__Z44zappar_zapcode_tracker_target_load_from_fileP25zappar_zapcode_tracker_tiPKc = Ke.Zb, n._zappar_zapcode_tracker_anchor_count = Ke._b, n._zappar_zapcode_tracker_anchor_id = Ke.$b, n._zappar_zapcode_tracker_anchor_pose_raw = Ke.ac, n._zappar_zapcode_tracker_enabled_set = Ke.bc, n._zappar_zapcode_tracker_enabled = Ke.cc, n._zappar_zapcode_tracker_target_loaded_version = Ke.dc;
		var Qe = n._malloc = Ke.ec;
		n._zappar_face_mesh_create = Ke.fc, n._zappar_face_mesh_destroy = Ke.gc, n.__Z33zappar_face_mesh_load_from_memoryP19zappar_face_mesh_tiPKciiiii = Ke.hc, n.__Z29zappar_face_mesh_indices_sizeP19zappar_face_mesh_ti = Ke.ic, n.__Z25zappar_face_mesh_uvs_sizeP19zappar_face_mesh_ti = Ke.jc, n.__Z30zappar_face_mesh_vertices_sizeP19zappar_face_mesh_ti = Ke.kc, n.__Z31zappar_face_mesh_loaded_versionP19zappar_face_mesh_ti = Ke.lc, n.__Z25zappar_face_mesh_verticesP19zappar_face_mesh_ti = Ke.mc, n.__Z20zappar_face_mesh_uvsP19zappar_face_mesh_ti = Ke.nc, n.__Z24zappar_face_mesh_indicesP19zappar_face_mesh_ti = Ke.oc, n.__Z23zappar_face_mesh_updateP19zappar_face_mesh_tiPKfS2_i = Ke.pc, n.__Z29zappar_face_mesh_normals_sizeP19zappar_face_mesh_ti = Ke.qc, n.__Z24zappar_face_mesh_normalsP19zappar_face_mesh_ti = Ke.rc, n._zappar_camera_source_create = Ke.sc, n._zappar_camera_source_destroy = Ke.tc, n._zappar_camera_source_start = Ke.uc, n._zappar_camera_source_pause = Ke.vc, n._zappar_camera_default_device_id = Ke.wc, n._zappar_sequence_source_create = Ke.xc, n.__Z28zappar_sequence_source_startP25zappar_sequence_source_ti = Ke.yc, n.__Z39zappar_sequence_source_load_from_memoryP25zappar_sequence_source_tiPKci = Ke.zc, n.__Z28zappar_sequence_source_pauseP25zappar_sequence_source_ti = Ke.Ac, n._zappar_sequence_source_destroy = Ke.Bc, n._zappar_sequence_source_max_playback_fps_set = Ke.Cc, n._zappar_log_level_set = Ke.Dc, n._zappar_log_level = Ke.Ec, n.__Z23zappar_log_redirect_setPFv18zappar_log_level_tPKcE = Ke.Fc, n._zappar_world_tracker_create = Ke.Gc, n._zappar_world_tracker_destroy = Ke.Hc, n._zappar_world_tracker_world_anchor_status = Ke.Ic, n._zappar_world_tracker_world_anchor_id = Ke.Jc, n._zappar_world_tracker_plane_anchor_count = Ke.Kc, n._zappar_world_tracker_plane_anchor_id = Ke.Lc, n._zappar_world_tracker_plane_anchor_pose_raw = Ke.Mc, n._zappar_world_tracker_world_anchor_pose_raw = Ke.Nc, n._zappar_world_tracker_ground_anchor_status = Ke.Oc, n._zappar_world_tracker_ground_anchor_id = Ke.Pc, n._zappar_world_tracker_ground_anchor_pose_raw = Ke.Qc, n._zappar_world_tracker_reset = Ke.Rc, n._zappar_world_tracker_enabled_set = Ke.Sc, n._zappar_world_tracker_enabled = Ke.Tc, n._zappar_world_tracker_scale_mode_set = Ke.Uc, n._zappar_world_tracker_scale_mode = Ke.Vc, n._zappar_world_tracker_session_number = Ke.Wc, n._zappar_world_tracker_quality = Ke.Xc, n._zappar_world_tracker_tracks_data_enabled = Ke.Yc, n._zappar_world_tracker_projections_data_enabled = Ke.Zc, n._zappar_world_tracker_tracks_data_enabled_set = Ke._c, n._zappar_world_tracker_projections_data_enabled_set = Ke.$c, n._zappar_world_tracker_tracks_data = Ke.ad, n._zappar_world_tracker_tracks_data_size = Ke.bd, n._zappar_world_tracker_tracks_type_data = Ke.cd, n._zappar_world_tracker_tracks_type_data_size = Ke.dd, n._zappar_world_tracker_projections_data = Ke.ed, n._zappar_world_tracker_projections_data_size = Ke.fd, n._zappar_world_tracker_horizontal_plane_detection_enabled = Ke.gd, n._zappar_world_tracker_horizontal_plane_detection_enabled_set = Ke.hd, n._zappar_world_tracker_vertical_plane_detection_enabled = Ke.id, n._zappar_world_tracker_vertical_plane_detection_enabled_set = Ke.jd, n._zappar_world_tracker_vertical_plane_detection_supported = Ke.kd, n._zappar_world_tracker_plane_anchor_orientation = Ke.ld, n._zappar_world_tracker_plane_anchor_polygon_data = Ke.md, n._zappar_world_tracker_plane_anchor_polygon_data_size = Ke.nd, n._zappar_world_tracker_plane_anchor_polygon_version = Ke.od, n._zappar_world_tracker_plane_anchor_status = Ke.pd, n._worker_message_send_count = Ke.qd, n._worker_message_send_clear = Ke.rd, n._worker_message_send_data_size = Ke.sd, n._worker_message_send_reference = Ke.td, n._worker_message_send_instance = Ke.ud, n._worker_message_send_data = Ke.vd, n._worker_message_receive = Ke.wd, n._ceres_worker = Ke.xd, n._data_download_clear = Ke.yd, n._data_download_size = Ke.zd, n._data_download = Ke.Ad, n._data_should_record_set = Ke.Bd, n._zappar_analytics_project_id_set = Ke.Cd, Ke.htons, Ke.ntohs;
		var er, rr = Ke.Dd, tr = Ke.Ed, ar = Ke.Fd, nr = Ke.Gd;
		function or() {
			function e() {
				er || (er = !0, n.calledRun = !0, x || (P = !0, n.noFSInit || ce.init.initialized || ce.init(), ce.ignorePermissions = !1, ne.init(), W(F), t(n), n.onRuntimeInitialized && n.onRuntimeInitialized(), function() {
					if (n.postRun) for ("function" == typeof n.postRun && (n.postRun = [n.postRun]); n.postRun.length;) C(n.postRun.shift());
					W(D);
				}()));
			}
			R > 0 || (function() {
				if (n.preRun) for ("function" == typeof n.preRun && (n.preRun = [n.preRun]); n.preRun.length;) A(n.preRun.shift());
				W(M);
			}(), R > 0 || (n.setStatus ? (n.setStatus("Running..."), setTimeout(function() {
				setTimeout(function() {
					n.setStatus("");
				}, 1), e();
			}, 1)) : e()));
		}
		if (n.___start_em_js = 673284, n.___stop_em_js = 674449, n.cwrap = (e, r, t, a) => {
			var n = !t || t.every((e) => "number" === e || "boolean" === e);
			return "string" !== r && n && !a ? Ue(e) : function() {
				return Ye(e, r, t, arguments);
			};
		}, n.setValue = function(e, r, t = "i8") {
			switch (t.endsWith("*") && (t = "*"), t) {
				case "i1":
				case "i8":
					g[0 | e] = r;
					break;
				case "i16":
					w[e >> 1] = r;
					break;
				case "i32":
					k[e >> 2] = r;
					break;
				case "i64": j("to do setValue(i64) use WASM_BIGINT");
				case "float":
					E[e >> 2] = r;
					break;
				case "double":
					z[e >> 3] = r;
					break;
				case "*":
					b[e >> 2] = r;
					break;
				default: j(`invalid type for setValue: ${t}`);
			}
		}, n.getValue = function(e, r = "i8") {
			switch (r.endsWith("*") && (r = "*"), r) {
				case "i1":
				case "i8": return g[0 | e];
				case "i16": return w[e >> 1];
				case "i32": return k[e >> 2];
				case "i64": j("to do getValue(i64) use WASM_BIGINT");
				case "float": return E[e >> 2];
				case "double": return z[e >> 3];
				case "*": return b[e >> 2];
				default: j(`invalid type for getValue: ${r}`);
			}
		}, n.UTF8ToString = de, O = function e() {
			er || or(), er || (O = e);
		}, n.preInit) for ("function" == typeof n.preInit && (n.preInit = [n.preInit]); n.preInit.length > 0;) n.preInit.pop()();
		return or(), r;
	}), t = function(e, r, t, a) {
		return new (t || (t = Promise))(function(n, o) {
			function i(e) {
				try {
					_(a.next(e));
				} catch (r) {
					o(r);
				}
			}
			function s(e) {
				try {
					_(a.throw(e));
				} catch (r) {
					o(r);
				}
			}
			function _(e) {
				var r;
				e.done ? n(e.value) : (r = e.value, r instanceof t ? r : new t(function(e) {
					e(r);
				})).then(i, s);
			}
			_((a = a.apply(e, r || [])).next());
		});
	};
	const a = self;
	let n = (e) => {
		e && e.data && "wasm" === e.data.t && (function(e, a, n, o) {
			t(this, void 0, void 0, function* () {
				let t = r({
					locateFile: (r, t) => r.endsWith("zappar-cv.wasm") ? e : t + r,
					instantiateWasm: (e, r) => {
						const t = new WebAssembly.Instance(a, e);
						return r(t), t.exports;
					},
					onRuntimeInitialized: () => {
						const e = t.cwrap("ceres_worker", null, ["number"]), r = function(e) {
							return {
								worker_message_send_count: e.cwrap("worker_message_send_count", "number", []),
								worker_message_send_clear: e.cwrap("worker_message_send_clear", null, []),
								worker_message_send_data_size: e.cwrap("worker_message_send_data_size", "number", ["number"]),
								worker_message_send_data: e.cwrap("worker_message_send_data", "number", ["number"]),
								worker_message_send_reference: e.cwrap("worker_message_send_reference", "number", ["number"]),
								worker_message_send_instance: e.cwrap("worker_message_send_instance", "number", ["number"]),
								worker_message_receive: e.cwrap("worker_message_receive", null, [
									"number",
									"number",
									"number",
									"number"
								])
							};
						}(t);
						n.addEventListener("message", (a) => {
							if ("msgsend" !== a.data.t) return;
							const i = a.data.data, s = a.data.reference, _ = t._malloc(i.byteLength);
							t.HEAPU8.set(i, _), r.worker_message_receive(s, i.byteLength, _, o), t._free(_), e(o);
							const c = r.worker_message_send_count();
							for (let e = 0; e < c; e++) {
								const a = r.worker_message_send_reference(e), o = r.worker_message_send_data_size(e), i = r.worker_message_send_data(e), s = t.HEAPU8.slice(i, i + o);
								n.postMessage({
									t: "msgrec",
									data: s,
									reference: a
								}, [s.buffer]);
							}
							r.worker_message_send_clear();
						}), n.start();
					}
				});
			});
		}(location.href.startsWith("blob") ? e.data.url : new URL("/assets/zappar-cv-BTDyQUix.wasm", "" + self.location.href).toString(), e.data.module, e.data.port, e.data.instance), a.removeEventListener("message", n));
	};
	a.addEventListener("message", n);
})();

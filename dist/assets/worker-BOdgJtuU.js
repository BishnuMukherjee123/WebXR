(function() {
	var e, r = Object.create, t = Object.defineProperty, a = Object.getOwnPropertyDescriptor, n = Object.getOwnPropertyNames, i = Object.getPrototypeOf, o = Object.prototype.hasOwnProperty, s = (e, r) => () => (r || (e((r = { exports: {} }).exports, r), e = null), r.exports), _ = (e, s, _) => (_ = null != e ? r(i(e)) : {}, ((e, r, i, s) => {
		if (r && "object" == typeof r || "function" == typeof r) for (var _, c = n(r), l = 0, p = c.length; l < p; l++) _ = c[l], o.call(e, _) || _ === i || t(e, _, {
			get: ((e) => r[e]).bind(null, _),
			enumerable: !(s = a(r, _)) || s.enumerable
		});
		return e;
	})(!s && e && e.__esModule ? _ : t(_, "default", {
		value: e,
		enumerable: !0
	}), e)), c = (e = "undefined" != typeof document && document.currentScript ? document.currentScript.src : void 0, function(r = {}) {
		var t, a, n = r;
		n.ready = new Promise((e, r) => {
			t = e, a = r;
		});
		var i, o, s, _ = Object.assign({}, n), c = "./this.program", l = (e, r) => {
			throw r;
		}, p = "";
		p = self.location.href, e && (p = e), p = p.startsWith("blob:") ? "" : p.substr(0, p.replace(/[?#].*/, "").lastIndexOf("/") + 1), i = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.send(null), r.responseText;
		}, s = (e) => {
			var r = new XMLHttpRequest();
			return r.open("GET", e, !1), r.responseType = "arraybuffer", r.send(null), new Uint8Array(r.response);
		}, o = (e, r, t) => {
			var a = new XMLHttpRequest();
			a.open("GET", e, !0), a.responseType = "arraybuffer", a.onload = () => {
				200 == a.status || 0 == a.status && a.response ? r(a.response) : t();
			}, a.onerror = t, a.send(null);
		};
		var u, d, m = n.print || console.log.bind(console), f = n.printErr || console.error.bind(console);
		Object.assign(n, _), _ = null, n.arguments && n.arguments, n.thisProgram && (c = n.thisProgram), n.quit && (l = n.quit), n.wasmBinary && (u = n.wasmBinary), "object" != typeof WebAssembly && N("no native wasm support detected");
		var h, b, w, g, y, v, k, E, A, z = !1;
		function x(e, r) {
			e || N(r);
		}
		function T() {
			var e = d.buffer;
			n.HEAP8 = b = new Int8Array(e), n.HEAP16 = g = new Int16Array(e), n.HEAPU8 = w = new Uint8Array(e), n.HEAPU16 = y = new Uint16Array(e), n.HEAP32 = v = new Int32Array(e), n.HEAPU32 = k = new Uint32Array(e), n.HEAPF32 = E = new Float32Array(e), n.HEAPF64 = A = new Float64Array(e);
		}
		var R = [], L = [], F = [], M = !1;
		function S(e) {
			R.unshift(e);
		}
		function P(e) {
			F.unshift(e);
		}
		var I = 0, O = null, C = null;
		function D(e) {
			I++, n.monitorRunDependencies?.(I);
		}
		function B(e) {
			if (I--, n.monitorRunDependencies?.(I), 0 == I && (null !== O && (clearInterval(O), O = null), C)) {
				var r = C;
				C = null, r();
			}
		}
		function N(e) {
			n.onAbort?.(e), f(e = "Aborted(" + e + ")"), z = !0, h = 1, e += ". Build with -sASSERTIONS for more info.", M && rr();
			var r = new WebAssembly.RuntimeError(e);
			throw a(r), r;
		}
		var U, V, G, H = "zappar-cv.wasm";
		function X(e, r) {
			var t, a = function(e) {
				if (e == H && u) return new Uint8Array(u);
				if (s) return s(e);
				throw "sync fetching of the wasm failed: you can preload it to Module[\"wasmBinary\"] manually, or emcc.py will do that for you when generating HTML (but not JS)";
			}(e);
			return t = new WebAssembly.Module(a), [new WebAssembly.Instance(t, r), t];
		}
		function W(e) {
			this.name = "ExitStatus", this.message = `Program terminated with exit(${e})`, this.status = e;
		}
		H.startsWith("data:application/octet-stream;base64,") || (U = H, H = n.locateFile ? n.locateFile(U, p) : p + U);
		var q = (e) => {
			for (; e.length > 0;) e.shift()(n);
		}, Y = n.noExitRuntime || !0, j = {
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
				var r = j.isAbs(e), t = "/" === e.substr(-1);
				return (e = j.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || r || (e = "."), e && t && (e += "/"), (r ? "/" : "") + e;
			},
			dirname: (e) => {
				var r = j.splitPath(e), t = r[0], a = r[1];
				return t || a ? (a && (a = a.substr(0, a.length - 1)), t + a) : ".";
			},
			basename: (e) => {
				if ("/" === e) return "/";
				var r = (e = (e = j.normalize(e)).replace(/\/$/, "")).lastIndexOf("/");
				return -1 === r ? e : e.substr(r + 1);
			},
			join: function() {
				var e = Array.prototype.slice.call(arguments);
				return j.normalize(e.join("/"));
			},
			join2: (e, r) => j.normalize(e + "/" + r)
		}, Z = (e) => (Z = (() => {
			if ("object" == typeof crypto && "function" == typeof crypto.getRandomValues) return (e) => crypto.getRandomValues(e);
			N("initRandomDevice");
		})())(e), K = {
			resolve: function() {
				for (var e = "", r = !1, t = arguments.length - 1; t >= -1 && !r; t--) {
					var a = t >= 0 ? arguments[t] : ce.cwd();
					if ("string" != typeof a) throw new TypeError("Arguments to path.resolve must be strings");
					if (!a) return "";
					e = a + "/" + e, r = j.isAbs(a);
				}
				return (r ? "/" : "") + (e = j.normalizeArray(e.split("/").filter((e) => !!e), !r).join("/")) || ".";
			},
			relative: (e, r) => {
				function t(e) {
					for (var r = 0; r < e.length && "" === e[r]; r++);
					for (var t = e.length - 1; t >= 0 && "" === e[t]; t--);
					return r > t ? [] : e.slice(r, t - r + 1);
				}
				e = K.resolve(e).substr(1), r = K.resolve(r).substr(1);
				for (var a = t(e.split("/")), n = t(r.split("/")), i = Math.min(a.length, n.length), o = i, s = 0; s < i; s++) if (a[s] !== n[s]) {
					o = s;
					break;
				}
				var _ = [];
				for (s = o; s < a.length; s++) _.push("..");
				return (_ = _.concat(n.slice(o))).join("/");
			}
		}, $ = "undefined" != typeof TextDecoder ? new TextDecoder("utf8") : void 0, Q = (e, r, t) => {
			for (var a = r + t, n = r; e[n] && !(n >= a);) ++n;
			if (n - r > 16 && e.buffer && $) return $.decode(e.subarray(r, n));
			for (var i = ""; r < n;) {
				var o = e[r++];
				if (128 & o) {
					var s = 63 & e[r++];
					if (192 != (224 & o)) {
						var _ = 63 & e[r++];
						if ((o = 224 == (240 & o) ? (15 & o) << 12 | s << 6 | _ : (7 & o) << 18 | s << 12 | _ << 6 | 63 & e[r++]) < 65536) i += String.fromCharCode(o);
						else {
							var c = o - 65536;
							i += String.fromCharCode(55296 | c >> 10, 56320 | 1023 & c);
						}
					} else i += String.fromCharCode((31 & o) << 6 | s);
				} else i += String.fromCharCode(o);
			}
			return i;
		}, J = [], ee = (e) => {
			for (var r = 0, t = 0; t < e.length; ++t) {
				var a = e.charCodeAt(t);
				a <= 127 ? r++ : a <= 2047 ? r += 2 : a >= 55296 && a <= 57343 ? (r += 4, ++t) : r += 3;
			}
			return r;
		}, re = (e, r, t, a) => {
			if (!(a > 0)) return 0;
			for (var n = t, i = t + a - 1, o = 0; o < e.length; ++o) {
				var s = e.charCodeAt(o);
				if (s >= 55296 && s <= 57343 && (s = 65536 + ((1023 & s) << 10) | 1023 & e.charCodeAt(++o)), s <= 127) {
					if (t >= i) break;
					r[t++] = s;
				} else if (s <= 2047) {
					if (t + 1 >= i) break;
					r[t++] = 192 | s >> 6, r[t++] = 128 | 63 & s;
				} else if (s <= 65535) {
					if (t + 2 >= i) break;
					r[t++] = 224 | s >> 12, r[t++] = 128 | s >> 6 & 63, r[t++] = 128 | 63 & s;
				} else {
					if (t + 3 >= i) break;
					r[t++] = 240 | s >> 18, r[t++] = 128 | s >> 12 & 63, r[t++] = 128 | s >> 6 & 63, r[t++] = 128 | 63 & s;
				}
			}
			return r[t] = 0, t - n;
		};
		function te(e, r, t) {
			var a = t > 0 ? t : ee(e) + 1, n = new Array(a), i = re(e, n, 0, n.length);
			return r && (n.length = i), n;
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
					for (var i = 0, o = 0; o < a; o++) {
						var s;
						try {
							s = e.tty.ops.get_char(e.tty);
						} catch (_) {
							throw new ce.ErrnoError(29);
						}
						if (void 0 === s && 0 === i) throw new ce.ErrnoError(6);
						if (null == s) break;
						i++, r[t + o] = s;
					}
					return i && (e.node.timestamp = Date.now()), i;
				},
				write(e, r, t, a, n) {
					if (!e.tty || !e.tty.ops.put_char) throw new ce.ErrnoError(60);
					try {
						for (var i = 0; i < a; i++) e.tty.ops.put_char(e.tty, r[t + i]);
					} catch (o) {
						throw new ce.ErrnoError(29);
					}
					return a && (e.node.timestamp = Date.now()), i;
				}
			},
			default_tty_ops: {
				get_char: (e) => (() => {
					if (!J.length) {
						var e = null;
						if ("undefined" != typeof window && "function" == typeof window.prompt ? null !== (e = window.prompt("Input: ")) && (e += "\n") : "function" == typeof readline && null !== (e = readline()) && (e += "\n"), !e) return null;
						J = te(e, !0);
					}
					return J.shift();
				})(),
				put_char(e, r) {
					null === r || 10 === r ? (m(Q(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (m(Q(e.output, 0)), e.output = []);
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
					null === r || 10 === r ? (f(Q(e.output, 0)), e.output = []) : 0 != r && e.output.push(r);
				},
				fsync(e) {
					e.output && e.output.length > 0 && (f(Q(e.output, 0)), e.output = []);
				}
			}
		}, ie = (e) => {
			N();
		}, oe = {
			ops_table: null,
			mount: (e) => oe.createNode(null, "/", 16895, 0),
			createNode(e, r, t, a) {
				if (ce.isBlkdev(t) || ce.isFIFO(t)) throw new ce.ErrnoError(63);
				oe.ops_table ||= {
					dir: {
						node: {
							getattr: oe.node_ops.getattr,
							setattr: oe.node_ops.setattr,
							lookup: oe.node_ops.lookup,
							mknod: oe.node_ops.mknod,
							rename: oe.node_ops.rename,
							unlink: oe.node_ops.unlink,
							rmdir: oe.node_ops.rmdir,
							readdir: oe.node_ops.readdir,
							symlink: oe.node_ops.symlink
						},
						stream: { llseek: oe.stream_ops.llseek }
					},
					file: {
						node: {
							getattr: oe.node_ops.getattr,
							setattr: oe.node_ops.setattr
						},
						stream: {
							llseek: oe.stream_ops.llseek,
							read: oe.stream_ops.read,
							write: oe.stream_ops.write,
							allocate: oe.stream_ops.allocate,
							mmap: oe.stream_ops.mmap,
							msync: oe.stream_ops.msync
						}
					},
					link: {
						node: {
							getattr: oe.node_ops.getattr,
							setattr: oe.node_ops.setattr,
							readlink: oe.node_ops.readlink
						},
						stream: {}
					},
					chrdev: {
						node: {
							getattr: oe.node_ops.getattr,
							setattr: oe.node_ops.setattr
						},
						stream: ce.chrdev_stream_ops
					}
				};
				var n = ce.createNode(e, r, t, a);
				return ce.isDir(n.mode) ? (n.node_ops = oe.ops_table.dir.node, n.stream_ops = oe.ops_table.dir.stream, n.contents = {}) : ce.isFile(n.mode) ? (n.node_ops = oe.ops_table.file.node, n.stream_ops = oe.ops_table.file.stream, n.usedBytes = 0, n.contents = null) : ce.isLink(n.mode) ? (n.node_ops = oe.ops_table.link.node, n.stream_ops = oe.ops_table.link.stream) : ce.isChrdev(n.mode) && (n.node_ops = oe.ops_table.chrdev.node, n.stream_ops = oe.ops_table.chrdev.stream), n.timestamp = Date.now(), e && (e.contents[r] = n, e.timestamp = n.timestamp), n;
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
					void 0 !== r.mode && (e.mode = r.mode), void 0 !== r.timestamp && (e.timestamp = r.timestamp), void 0 !== r.size && oe.resizeFileStorage(e, r.size);
				},
				lookup(e, r) {
					throw ce.genericErrors[44];
				},
				mknod: (e, r, t, a) => oe.createNode(e, r, t, a),
				rename(e, r, t) {
					if (ce.isDir(e.mode)) {
						var a;
						try {
							a = ce.lookupNode(r, t);
						} catch (i) {}
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
					var a = oe.createNode(e, r, 41471, 0);
					return a.link = t, a;
				},
				readlink(e) {
					if (!ce.isLink(e.mode)) throw new ce.ErrnoError(28);
					return e.link;
				}
			},
			stream_ops: {
				read(e, r, t, a, n) {
					var i = e.node.contents;
					if (n >= e.node.usedBytes) return 0;
					var o = Math.min(e.node.usedBytes - n, a);
					if (o > 8 && i.subarray) r.set(i.subarray(n, n + o), t);
					else for (var s = 0; s < o; s++) r[t + s] = i[n + s];
					return o;
				},
				write(e, r, t, a, n, i) {
					if (r.buffer === b.buffer && (i = !1), !a) return 0;
					var o = e.node;
					if (o.timestamp = Date.now(), r.subarray && (!o.contents || o.contents.subarray)) {
						if (i) return o.contents = r.subarray(t, t + a), o.usedBytes = a, a;
						if (0 === o.usedBytes && 0 === n) return o.contents = r.slice(t, t + a), o.usedBytes = a, a;
						if (n + a <= o.usedBytes) return o.contents.set(r.subarray(t, t + a), n), a;
					}
					if (oe.expandFileStorage(o, n + a), o.contents.subarray && r.subarray) o.contents.set(r.subarray(t, t + a), n);
					else for (var s = 0; s < a; s++) o.contents[n + s] = r[t + s];
					return o.usedBytes = Math.max(o.usedBytes, n + a), a;
				},
				llseek(e, r, t) {
					var a = r;
					if (1 === t ? a += e.position : 2 === t && ce.isFile(e.node.mode) && (a += e.node.usedBytes), a < 0) throw new ce.ErrnoError(28);
					return a;
				},
				allocate(e, r, t) {
					oe.expandFileStorage(e.node, r + t), e.node.usedBytes = Math.max(e.node.usedBytes, r + t);
				},
				mmap(e, r, t, a, n) {
					if (!ce.isFile(e.node.mode)) throw new ce.ErrnoError(43);
					var i, o, s = e.node.contents;
					if (2 & n || s.buffer !== b.buffer) {
						if ((t > 0 || t + r < s.length) && (s = s.subarray ? s.subarray(t, t + r) : Array.prototype.slice.call(s, t, t + r)), o = !0, !(i = ie())) throw new ce.ErrnoError(48);
						b.set(s, i);
					} else o = !1, i = s.byteOffset;
					return {
						ptr: i,
						allocated: o
					};
				},
				msync: (e, r, t, a, n) => (oe.stream_ops.write(e, r, 0, a, t, !1), 0)
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
				if (!(e = K.resolve(e))) return {
					path: "",
					node: null
				};
				if ((r = Object.assign({
					follow_mount: !0,
					recurse_count: 0
				}, r)).recurse_count > 8) throw new ce.ErrnoError(32);
				for (var t = e.split("/").filter((e) => !!e), a = ce.root, n = "/", i = 0; i < t.length; i++) {
					var o = i === t.length - 1;
					if (o && r.parent) break;
					if (a = ce.lookupNode(a, t[i]), n = j.join2(n, t[i]), ce.isMountpoint(a) && (!o || o && r.follow_mount) && (a = a.mounted.root), !o || r.follow) for (var s = 0; ce.isLink(a.mode);) {
						var _ = ce.readlink(n);
						if (n = K.resolve(j.dirname(n), _), a = ce.lookupPath(n, { recurse_count: r.recurse_count + 1 }).node, s++ > 40) throw new ce.ErrnoError(32);
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
					var i = n.name;
					if (n.parent.id === e.id && i === r) return n;
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
				} catch (i) {
					return i.errno;
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
				function i(e) {
					if (e) return i.errored ? void 0 : (i.errored = !0, n(e));
					++a >= t.length && n(null);
				}
				t.forEach((r) => {
					if (!r.type.syncfs) return i(null);
					r.type.syncfs(r, e, i);
				});
			},
			mount(e, r, t) {
				var a, n = "/" === t, i = !t;
				if (n && ce.root) throw new ce.ErrnoError(10);
				if (!n && !i) {
					var o = ce.lookupPath(t, { follow_mount: !1 });
					if (t = o.path, a = o.node, ce.isMountpoint(a)) throw new ce.ErrnoError(10);
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
				var i = t.mount.mounts.indexOf(a);
				t.mount.mounts.splice(i, 1);
			},
			lookup: (e, r) => e.node_ops.lookup(e, r),
			mknod(e, r, t) {
				var a = ce.lookupPath(e, { parent: !0 }).node, n = j.basename(e);
				if (!n || "." === n || ".." === n) throw new ce.ErrnoError(28);
				var i = ce.mayCreate(a, n);
				if (i) throw new ce.ErrnoError(i);
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
					} catch (i) {
						if (20 != i.errno) throw i;
					}
				}
			},
			mkdev: (e, r, t) => (void 0 === t && (t = r, r = 438), r |= 8192, ce.mknod(e, r, t)),
			symlink(e, r) {
				if (!K.resolve(e)) throw new ce.ErrnoError(44);
				var t = ce.lookupPath(r, { parent: !0 }).node;
				if (!t) throw new ce.ErrnoError(44);
				var a = j.basename(r), n = ce.mayCreate(t, a);
				if (n) throw new ce.ErrnoError(n);
				if (!t.node_ops.symlink) throw new ce.ErrnoError(63);
				return t.node_ops.symlink(t, a, e);
			},
			rename(e, r) {
				var t, a = j.dirname(e), n = j.dirname(r), i = j.basename(e), o = j.basename(r), s = ce.lookupPath(e, { parent: !0 }), _ = s.node;
				if (t = (s = ce.lookupPath(r, { parent: !0 })).node, !_ || !t) throw new ce.ErrnoError(44);
				if (_.mount !== t.mount) throw new ce.ErrnoError(75);
				var c, l = ce.lookupNode(_, i), p = K.relative(e, n);
				if ("." !== p.charAt(0)) throw new ce.ErrnoError(28);
				if ("." !== (p = K.relative(r, a)).charAt(0)) throw new ce.ErrnoError(55);
				try {
					c = ce.lookupNode(t, o);
				} catch (m) {}
				if (l !== c) {
					var u = ce.isDir(l.mode), d = ce.mayDelete(_, i, u);
					if (d) throw new ce.ErrnoError(d);
					if (d = c ? ce.mayDelete(t, o, u) : ce.mayCreate(t, o)) throw new ce.ErrnoError(d);
					if (!_.node_ops.rename) throw new ce.ErrnoError(63);
					if (ce.isMountpoint(l) || c && ce.isMountpoint(c)) throw new ce.ErrnoError(10);
					if (t !== _ && (d = ce.nodePermissions(_, "w"))) throw new ce.ErrnoError(d);
					ce.hashRemoveNode(l);
					try {
						_.node_ops.rename(l, t, o);
					} catch (m) {
						throw m;
					} finally {
						ce.hashAddNode(l);
					}
				}
			},
			rmdir(e) {
				var r = ce.lookupPath(e, { parent: !0 }).node, t = j.basename(e), a = ce.lookupNode(r, t), n = ce.mayDelete(r, t, !0);
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
				var t = j.basename(e), a = ce.lookupNode(r, t), n = ce.mayDelete(r, t, !1);
				if (n) throw new ce.ErrnoError(n);
				if (!r.node_ops.unlink) throw new ce.ErrnoError(63);
				if (ce.isMountpoint(a)) throw new ce.ErrnoError(10);
				r.node_ops.unlink(r, t), ce.destroyNode(a);
			},
			readlink(e) {
				var r = ce.lookupPath(e).node;
				if (!r) throw new ce.ErrnoError(44);
				if (!r.node_ops.readlink) throw new ce.ErrnoError(28);
				return K.resolve(ce.getPath(r.parent), r.node_ops.readlink(r));
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
					e = j.normalize(e);
					try {
						a = ce.lookupPath(e, { follow: !(131072 & r) }).node;
					} catch (_) {}
				}
				var i = !1;
				if (64 & r) if (a) {
					if (128 & r) throw new ce.ErrnoError(20);
				} else a = ce.mknod(e, t, 0), i = !0;
				if (!a) throw new ce.ErrnoError(44);
				if (ce.isChrdev(a.mode) && (r &= -513), 65536 & r && !ce.isDir(a.mode)) throw new ce.ErrnoError(54);
				if (!i) {
					var o = ce.mayOpen(a, r);
					if (o) throw new ce.ErrnoError(o);
				}
				512 & r && !i && ce.truncate(a, 0), r &= -131713;
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
				var i = void 0 !== n;
				if (i) {
					if (!e.seekable) throw new ce.ErrnoError(70);
				} else n = e.position;
				var o = e.stream_ops.read(e, r, t, a, n);
				return i || (e.position += o), o;
			},
			write(e, r, t, a, n, i) {
				if (a < 0 || n < 0) throw new ce.ErrnoError(28);
				if (ce.isClosed(e)) throw new ce.ErrnoError(8);
				if (!(2097155 & e.flags)) throw new ce.ErrnoError(8);
				if (ce.isDir(e.node.mode)) throw new ce.ErrnoError(31);
				if (!e.stream_ops.write) throw new ce.ErrnoError(28);
				e.seekable && 1024 & e.flags && ce.llseek(e, 0, 2);
				var o = void 0 !== n;
				if (o) {
					if (!e.seekable) throw new ce.ErrnoError(70);
				} else n = e.position;
				var s = e.stream_ops.write(e, r, t, a, n, i);
				return o || (e.position += s), s;
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
				var t, a = ce.open(e, r.flags), n = ce.stat(e).size, i = new Uint8Array(n);
				return ce.read(a, i, 0, n, 0), "utf8" === r.encoding ? t = Q(i, 0) : "binary" === r.encoding && (t = i), ce.close(a), t;
			},
			writeFile(e, r, t = {}) {
				t.flags = t.flags || 577;
				var a = ce.open(e, t.flags, t.mode);
				if ("string" == typeof r) {
					var n = new Uint8Array(ee(r) + 1), i = re(r, n, 0, n.length);
					ce.write(a, n, 0, i, void 0, t.canOwn);
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
				var e = new Uint8Array(1024), r = 0, t = () => (0 === r && (r = Z(e).byteLength), e[--r]);
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
				}), ce.nameTable = new Array(4096), ce.mount(oe, {}, "/"), ce.createDefaultDirectories(), ce.createDefaultDevices(), ce.createSpecialDirectories(), ce.filesystems = { MEMFS: oe };
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
					t.parentExists = !0, t.parentPath = a.path, t.parentObject = a.node, t.name = j.basename(e), a = ce.lookupPath(e, { follow: !r }), t.exists = !0, t.path = a.path, t.object = a.node, t.name = a.node.name, t.isRoot = "/" === a.path;
				} catch (n) {
					t.error = n.errno;
				}
				return t;
			},
			createPath(e, r, t, a) {
				e = "string" == typeof e ? e : ce.getPath(e);
				for (var n = r.split("/").reverse(); n.length;) {
					var i = n.pop();
					if (i) {
						var o = j.join2(e, i);
						try {
							ce.mkdir(o);
						} catch (s) {}
						e = o;
					}
				}
				return o;
			},
			createFile(e, r, t, a, n) {
				var i = j.join2("string" == typeof e ? e : ce.getPath(e), r), o = _e(a, n);
				return ce.create(i, o);
			},
			createDataFile(e, r, t, a, n, i) {
				var o = r;
				e && (e = "string" == typeof e ? e : ce.getPath(e), o = r ? j.join2(e, r) : e);
				var s = _e(a, n), _ = ce.create(o, s);
				if (t) {
					if ("string" == typeof t) {
						for (var c = new Array(t.length), l = 0, p = t.length; l < p; ++l) c[l] = t.charCodeAt(l);
						t = c;
					}
					ce.chmod(_, 146 | s);
					var u = ce.open(_, 577);
					ce.write(u, t, 0, t.length, 0, i), ce.close(u), ce.chmod(_, s);
				}
			},
			createDevice(e, r, t, a) {
				var n = j.join2("string" == typeof e ? e : ce.getPath(e), r), i = _e(!!t, !!a);
				ce.createDevice.major || (ce.createDevice.major = 64);
				var o = ce.makedev(ce.createDevice.major++, 0);
				return ce.registerDevice(o, {
					open(e) {
						e.seekable = !1;
					},
					close(e) {
						a?.buffer?.length && a(10);
					},
					read(e, r, a, n, i) {
						for (var o = 0, s = 0; s < n; s++) {
							var _;
							try {
								_ = t();
							} catch (c) {
								throw new ce.ErrnoError(29);
							}
							if (void 0 === _ && 0 === o) throw new ce.ErrnoError(6);
							if (null == _) break;
							o++, r[a + s] = _;
						}
						return o && (e.node.timestamp = Date.now()), o;
					},
					write(e, r, t, n, i) {
						for (var o = 0; o < n; o++) try {
							a(r[t + o]);
						} catch (s) {
							throw new ce.ErrnoError(29);
						}
						return n && (e.node.timestamp = Date.now()), o;
					}
				}), ce.mkdev(n, i, o);
			},
			forceLoadFile(e) {
				if (e.isDevice || e.isFolder || e.link || e.contents) return !0;
				if ("undefined" != typeof XMLHttpRequest) throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
				if (!i) throw new Error("Cannot load without read() or XMLHttpRequest.");
				try {
					e.contents = te(i(e.url), !0), e.usedBytes = e.contents.length;
				} catch (r) {
					throw new ce.ErrnoError(29);
				}
			},
			createLazyFile(e, r, t, a, n) {
				function i() {
					this.lengthKnown = !1, this.chunks = [];
				}
				if (i.prototype.get = function(e) {
					if (!(e > this.length - 1 || e < 0)) {
						var r = e % this.chunkSize, t = e / this.chunkSize | 0;
						return this.getter(t)[r];
					}
				}, i.prototype.setDataGetter = function(e) {
					this.getter = e;
				}, i.prototype.cacheLength = function() {
					var e = new XMLHttpRequest();
					if (e.open("HEAD", t, !1), e.send(null), !(e.status >= 200 && e.status < 300 || 304 === e.status)) throw new Error("Couldn't load " + t + ". Status: " + e.status);
					var r, a = Number(e.getResponseHeader("Content-length")), n = (r = e.getResponseHeader("Accept-Ranges")) && "bytes" === r, i = (r = e.getResponseHeader("Content-Encoding")) && "gzip" === r, o = 1048576;
					n || (o = a);
					var s = this;
					s.setDataGetter((e) => {
						var r = e * o, n = (e + 1) * o - 1;
						if (n = Math.min(n, a - 1), void 0 === s.chunks[e] && (s.chunks[e] = ((e, r) => {
							if (e > r) throw new Error("invalid range (" + e + ", " + r + ") or no bytes requested!");
							if (r > a - 1) throw new Error("only " + a + " bytes available! programmer error!");
							var n = new XMLHttpRequest();
							if (n.open("GET", t, !1), a !== o && n.setRequestHeader("Range", "bytes=" + e + "-" + r), n.responseType = "arraybuffer", n.overrideMimeType && n.overrideMimeType("text/plain; charset=x-user-defined"), n.send(null), !(n.status >= 200 && n.status < 300 || 304 === n.status)) throw new Error("Couldn't load " + t + ". Status: " + n.status);
							return void 0 !== n.response ? new Uint8Array(n.response || []) : te(n.responseText || "", !0);
						})(r, n)), void 0 === s.chunks[e]) throw new Error("doXHR failed!");
						return s.chunks[e];
					}), !i && a || (o = a = 1, a = this.getter(0).length, o = a, m("LazyFiles on gzip forces download of the whole file when length is accessed")), this._length = a, this._chunkSize = o, this.lengthKnown = !0;
				}, "undefined" != typeof XMLHttpRequest) {
					var o = new i();
					Object.defineProperties(o, {
						length: { get: function() {
							return this.lengthKnown || this.cacheLength(), this._length;
						} },
						chunkSize: { get: function() {
							return this.lengthKnown || this.cacheLength(), this._chunkSize;
						} }
					});
					var s = {
						isDevice: !1,
						contents: o
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
				function l(e, r, t, a, n) {
					var i = e.node.contents;
					if (n >= i.length) return 0;
					var o = Math.min(i.length - n, a);
					if (i.slice) for (var s = 0; s < o; s++) r[t + s] = i[n + s];
					else for (s = 0; s < o; s++) r[t + s] = i.get(n + s);
					return o;
				}
				return Object.keys(_.stream_ops).forEach((e) => {
					var r = _.stream_ops[e];
					c[e] = function() {
						return ce.forceLoadFile(_), r.apply(null, arguments);
					};
				}), c.read = (e, r, t, a, n) => (ce.forceLoadFile(_), l(e, r, t, a, n)), c.mmap = (e, r, t, a, n) => {
					ce.forceLoadFile(_);
					var i = ie();
					if (!i) throw new ce.ErrnoError(48);
					return l(e, b, i, r, t), {
						ptr: i,
						allocated: !0
					};
				}, _.stream_ops = c, _;
			}
		}, le = (e, r) => e ? Q(w, e, r) : "", pe = {
			DEFAULT_POLLMASK: 5,
			calculateAt(e, r, t) {
				if (j.isAbs(r)) return r;
				var a;
				if (a = -100 === e ? ce.cwd() : pe.getStreamFromFD(e).path, 0 == r.length) {
					if (!t) throw new ce.ErrnoError(44);
					return a;
				}
				return j.join2(a, r);
			},
			doStat(e, r, t) {
				var a = e(r);
				v[t >> 2] = a.dev, v[t + 4 >> 2] = a.mode, k[t + 8 >> 2] = a.nlink, v[t + 12 >> 2] = a.uid, v[t + 16 >> 2] = a.gid, v[t + 20 >> 2] = a.rdev, G = [a.size >>> 0, (V = a.size, +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[t + 24 >> 2] = G[0], v[t + 28 >> 2] = G[1], v[t + 32 >> 2] = 4096, v[t + 36 >> 2] = a.blocks;
				var n = a.atime.getTime(), i = a.mtime.getTime(), o = a.ctime.getTime();
				return G = [Math.floor(n / 1e3) >>> 0, (V = Math.floor(n / 1e3), +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[t + 40 >> 2] = G[0], v[t + 44 >> 2] = G[1], k[t + 48 >> 2] = n % 1e3 * 1e3, G = [Math.floor(i / 1e3) >>> 0, (V = Math.floor(i / 1e3), +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[t + 56 >> 2] = G[0], v[t + 60 >> 2] = G[1], k[t + 64 >> 2] = i % 1e3 * 1e3, G = [Math.floor(o / 1e3) >>> 0, (V = Math.floor(o / 1e3), +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[t + 72 >> 2] = G[0], v[t + 76 >> 2] = G[1], k[t + 80 >> 2] = o % 1e3 * 1e3, G = [a.ino >>> 0, (V = a.ino, +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[t + 88 >> 2] = G[0], v[t + 92 >> 2] = G[1], 0;
			},
			doMsync(e, r, t, a, n) {
				if (!ce.isFile(r.node.mode)) throw new ce.ErrnoError(43);
				if (2 & a) return 0;
				var i = w.slice(e, e + t);
				ce.msync(r, i, n, t, a);
			},
			varargs: void 0,
			get() {
				var e = v[+pe.varargs >> 2];
				return pe.varargs += 4, e;
			},
			getp: () => pe.get(),
			getStr: (e) => le(e),
			getStreamFromFD: (e) => ce.getStreamChecked(e)
		}, ue = (e, r, t) => re(e, w, r, t), de = (e, r) => r + 2097152 >>> 0 < 4194305 - !!e ? (e >>> 0) + 4294967296 * r : NaN, me = (e) => e % 4 == 0 && (e % 100 != 0 || e % 400 == 0), fe = [
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
		], be = (e) => {
			var r = ee(e) + 1, t = Je(r);
			return t && ue(e, t, r), t;
		}, we = (e) => {
			if (e instanceof W || "unwind" == e) return h;
			l(1, e);
		}, ge = () => Y || !1, ye = (e, r) => {
			var t;
			h = e, h = t = e, ge() || (n.onExit?.(t), z = !0), l(t, new W(t));
		}, ve = (e) => {
			if (!z) try {
				e(), (() => {
					if (!ge()) try {
						ye(h);
					} catch (e) {
						we(e);
					}
				})();
			} catch (r) {
				we(r);
			}
		}, ke = (e, r) => setTimeout(() => {
			ve(e);
		}, r), Ee = (e, r) => {
			if (ze.mainLoop.timingMode = e, ze.mainLoop.timingValue = r, !ze.mainLoop.func) return 1;
			if (ze.mainLoop.running || (ze.mainLoop.running = !0), 0 == e) ze.mainLoop.scheduler = function() {
				var e = 0 | Math.max(0, ze.mainLoop.tickStartTime + r - Ae());
				setTimeout(ze.mainLoop.runner, e);
			}, ze.mainLoop.method = "timeout";
			else if (1 == e) ze.mainLoop.scheduler = function() {
				ze.requestAnimationFrame(ze.mainLoop.runner);
			}, ze.mainLoop.method = "rAF";
			else if (2 == e) {
				if (void 0 === ze.setImmediate) if ("undefined" == typeof setImmediate) {
					var t = [], a = "setimmediate";
					addEventListener("message", (e) => {
						e.data !== a && e.data.target !== a || (e.stopPropagation(), t.shift()());
					}, !0), ze.setImmediate = function(e) {
						t.push(e), void 0 === n.setImmediates && (n.setImmediates = []), n.setImmediates.push(e), postMessage({ target: a });
					};
				} else ze.setImmediate = setImmediate;
				ze.mainLoop.scheduler = function() {
					ze.setImmediate(ze.mainLoop.runner);
				}, ze.mainLoop.method = "immediate";
			}
			return 0;
		}, Ae = () => performance.now(), ze = {
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
					ze.mainLoop.scheduler = null, ze.mainLoop.currentlyRunningMainloop++;
				},
				resume() {
					ze.mainLoop.currentlyRunningMainloop++;
					var e = ze.mainLoop.timingMode, r = ze.mainLoop.timingValue, t = ze.mainLoop.func;
					ze.mainLoop.func = null, ((e, r, t, a, n) => {
						x(!ze.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters."), ze.mainLoop.func = e, ze.mainLoop.arg = a;
						var i = ze.mainLoop.currentlyRunningMainloop;
						function o() {
							return !(i < ze.mainLoop.currentlyRunningMainloop);
						}
						if (ze.mainLoop.running = !1, ze.mainLoop.runner = function() {
							if (!z) if (ze.mainLoop.queue.length > 0) {
								var r = ze.mainLoop.queue.shift();
								if (r.func(r.arg), ze.mainLoop.remainingBlockers) {
									var t = ze.mainLoop.remainingBlockers, a = t % 1 == 0 ? t - 1 : Math.floor(t);
									r.counted ? ze.mainLoop.remainingBlockers = a : (a += .5, ze.mainLoop.remainingBlockers = (8 * t + a) / 9);
								}
								if (ze.mainLoop.updateStatus(), !o()) return;
								setTimeout(ze.mainLoop.runner, 0);
							} else o() && (ze.mainLoop.currentFrameNumber = ze.mainLoop.currentFrameNumber + 1 | 0, 1 == ze.mainLoop.timingMode && ze.mainLoop.timingValue > 1 && ze.mainLoop.currentFrameNumber % ze.mainLoop.timingValue != 0 ? ze.mainLoop.scheduler() : (0 == ze.mainLoop.timingMode && (ze.mainLoop.tickStartTime = Ae()), ze.mainLoop.runIter(e), o() && ("object" == typeof SDL && SDL.audio?.queueNewAudioData?.(), ze.mainLoop.scheduler())));
						}, n || (r && r > 0 ? Ee(0, 1e3 / r) : Ee(1, 1), ze.mainLoop.scheduler()), t) throw "unwind";
					})(t, 0, !1, ze.mainLoop.arg, !0), Ee(e, r), ze.mainLoop.scheduler();
				},
				updateStatus() {
					if (n.setStatus) {
						var e = n.statusMessage || "Please wait...", r = ze.mainLoop.remainingBlockers, t = ze.mainLoop.expectedBlockers;
						r ? r < t ? n.setStatus(e + " (" + (t - r) + "/" + t + ")") : n.setStatus(e) : n.setStatus("");
					}
				},
				runIter(e) {
					z || n.preMainLoop && !1 === n.preMainLoop() || (ve(e), n.postMainLoop?.());
				}
			},
			isFullscreen: !1,
			pointerLock: !1,
			moduleContextCreatedCallbacks: [],
			workers: [],
			init() {
				if (!ze.initted) {
					ze.initted = !0;
					se.push({
						canHandle: function(e) {
							return !n.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(e);
						},
						handle: function(e, r, t, a) {
							var n = new Blob([e], { type: ze.getMimetype(r) });
							n.size !== e.length && (n = new Blob([new Uint8Array(e).buffer], { type: ze.getMimetype(r) }));
							var i = URL.createObjectURL(n), o = new Image();
							o.onload = () => {
								x(o.complete, `Image ${r} could not be decoded`);
								var a = document.createElement("canvas");
								a.width = o.width, a.height = o.height, a.getContext("2d").drawImage(o, 0, 0), je[r] = a, URL.revokeObjectURL(i), t?.(e);
							}, o.onerror = (e) => {
								f(`Image ${i} could not be decoded`), a?.();
							}, o.src = i;
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
							function i(a) {
								n || (n = !0, Ze[r] = a, t?.(e));
							}
							var o = new Blob([e], { type: ze.getMimetype(r) }), s = URL.createObjectURL(o), _ = new Audio();
							_.addEventListener("canplaythrough", () => i(_), !1), _.onerror = function(t) {
								n || (f(`warning: browser could not fully decode audio ${r}, trying slower base64 approach`), _.src = "data:audio/x-" + r.substr(-3) + ";base64," + function(e) {
									for (var r = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", t = "", a = 0, n = 0, i = 0; i < e.length; i++) for (a = a << 8 | e[i], n += 8; n >= 6;) {
										var o = a >> n - 6 & 63;
										n -= 6, t += r[o];
									}
									return 2 == n ? (t += r[(3 & a) << 4], t += "==") : 4 == n && (t += r[(15 & a) << 2], t += "="), t;
								}(e), i(_));
							}, _.src = s, ke(() => {
								i(_);
							}, 1e4);
						}
					});
					var t = n.canvas;
					t && (t.requestPointerLock = t.requestPointerLock || t.mozRequestPointerLock || t.webkitRequestPointerLock || t.msRequestPointerLock || (() => {}), t.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock || document.msExitPointerLock || (() => {}), t.exitPointerLock = t.exitPointerLock.bind(document), document.addEventListener("pointerlockchange", a, !1), document.addEventListener("mozpointerlockchange", a, !1), document.addEventListener("webkitpointerlockchange", a, !1), document.addEventListener("mspointerlockchange", a, !1), n.elementPointerLock && t.addEventListener("click", (e) => {
						!ze.pointerLock && n.canvas.requestPointerLock && (n.canvas.requestPointerLock(), e.preventDefault());
					}, !1));
				}
				function a() {
					ze.pointerLock = document.pointerLockElement === n.canvas || document.mozPointerLockElement === n.canvas || document.webkitPointerLockElement === n.canvas || document.msPointerLockElement === n.canvas;
				}
			},
			createContext(e, r, t, a) {
				if (r && n.ctx && e == n.canvas) return n.ctx;
				var i, o;
				if (r) {
					var s = {
						antialias: !1,
						alpha: !1,
						majorVersion: 1
					};
					if (a) for (var _ in a) s[_] = a[_];
					void 0 !== Ce && (o = Ce.createContext(e, s)) && (i = Ce.getContext(o).GLctx);
				} else i = e.getContext("2d");
				return i ? (t && (r || x(void 0 === Ye, "cannot set in module if GLctx is used, but we are a non-GL context that would replace it"), n.ctx = i, r && Ce.makeContextCurrent(o), n.useWebGL = r, ze.moduleContextCreatedCallbacks.forEach((e) => e()), ze.init()), i) : null;
			},
			destroyContext(e, r, t) {},
			fullscreenHandlersInstalled: !1,
			lockPointer: void 0,
			resizeCanvas: void 0,
			requestFullscreen(e, r) {
				ze.lockPointer = e, ze.resizeCanvas = r, void 0 === ze.lockPointer && (ze.lockPointer = !0), void 0 === ze.resizeCanvas && (ze.resizeCanvas = !1);
				var t = n.canvas;
				function a() {
					ze.isFullscreen = !1;
					var e = t.parentNode;
					(document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === e ? (t.exitFullscreen = ze.exitFullscreen, ze.lockPointer && t.requestPointerLock(), ze.isFullscreen = !0, ze.resizeCanvas ? ze.setFullscreenCanvasSize() : ze.updateCanvasDimensions(t)) : (e.parentNode.insertBefore(t, e), e.parentNode.removeChild(e), ze.resizeCanvas ? ze.setWindowedCanvasSize() : ze.updateCanvasDimensions(t)), n.onFullScreen?.(ze.isFullscreen), n.onFullscreen?.(ze.isFullscreen);
				}
				ze.fullscreenHandlersInstalled || (ze.fullscreenHandlersInstalled = !0, document.addEventListener("fullscreenchange", a, !1), document.addEventListener("mozfullscreenchange", a, !1), document.addEventListener("webkitfullscreenchange", a, !1), document.addEventListener("MSFullscreenChange", a, !1));
				var i = document.createElement("div");
				t.parentNode.insertBefore(i, t), i.appendChild(t), i.requestFullscreen = i.requestFullscreen || i.mozRequestFullScreen || i.msRequestFullscreen || (i.webkitRequestFullscreen ? () => i.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT) : null) || (i.webkitRequestFullScreen ? () => i.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : null), i.requestFullscreen();
			},
			exitFullscreen: () => !!ze.isFullscreen && ((document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.msExitFullscreen || document.webkitCancelFullScreen || (() => {})).apply(document, []), !0),
			nextRAF: 0,
			fakeRequestAnimationFrame(e) {
				var r = Date.now();
				if (0 === ze.nextRAF) ze.nextRAF = r + 1e3 / 60;
				else for (; r + 2 >= ze.nextRAF;) ze.nextRAF += 1e3 / 60;
				var t = Math.max(ze.nextRAF - r, 0);
				setTimeout(e, t);
			},
			requestAnimationFrame(e) {
				"function" != typeof requestAnimationFrame ? (0, ze.fakeRequestAnimationFrame)(e) : requestAnimationFrame(e);
			},
			safeSetTimeout: (e, r) => ke(e, r),
			safeRequestAnimationFrame: (e) => ze.requestAnimationFrame(() => {
				ve(e);
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
				var t = n.canvas.getBoundingClientRect(), a = n.canvas.width, i = n.canvas.height, o = void 0 !== window.scrollX ? window.scrollX : window.pageXOffset, s = void 0 !== window.scrollY ? window.scrollY : window.pageYOffset, _ = e - (o + t.left), c = r - (s + t.top);
				return {
					x: _ *= a / t.width,
					y: c *= i / t.height
				};
			},
			setMouseCoords(e, r) {
				const { x: t, y: a } = ze.calculateMouseCoords(e, r);
				ze.mouseMovementX = t - ze.mouseX, ze.mouseMovementY = a - ze.mouseY, ze.mouseX = t, ze.mouseY = a;
			},
			calculateMouseEvent(e) {
				if (ze.pointerLock) "mousemove" != e.type && "mozMovementX" in e ? ze.mouseMovementX = ze.mouseMovementY = 0 : (ze.mouseMovementX = ze.getMovementX(e), ze.mouseMovementY = ze.getMovementY(e)), "undefined" != typeof SDL ? (ze.mouseX = SDL.mouseX + ze.mouseMovementX, ze.mouseY = SDL.mouseY + ze.mouseMovementY) : (ze.mouseX += ze.mouseMovementX, ze.mouseY += ze.mouseMovementY);
				else {
					if ("touchstart" === e.type || "touchend" === e.type || "touchmove" === e.type) {
						var r = e.touch;
						if (void 0 === r) return;
						var t = ze.calculateMouseCoords(r.pageX, r.pageY);
						if ("touchstart" === e.type) ze.lastTouches[r.identifier] = t, ze.touches[r.identifier] = t;
						else if ("touchend" === e.type || "touchmove" === e.type) {
							var a = ze.touches[r.identifier];
							a ||= t, ze.lastTouches[r.identifier] = a, ze.touches[r.identifier] = t;
						}
						return;
					}
					ze.setMouseCoords(e.pageX, e.pageY);
				}
			},
			resizeListeners: [],
			updateResizeListeners() {
				var e = n.canvas;
				ze.resizeListeners.forEach((r) => r(e.width, e.height));
			},
			setCanvasSize(e, r, t) {
				var a = n.canvas;
				ze.updateCanvasDimensions(a, e, r), t || ze.updateResizeListeners();
			},
			windowedWidth: 0,
			windowedHeight: 0,
			setFullscreenCanvasSize() {
				if ("undefined" != typeof SDL) {
					var e = k[SDL.screen >> 2];
					e |= 8388608, v[SDL.screen >> 2] = e;
				}
				ze.updateCanvasDimensions(n.canvas), ze.updateResizeListeners();
			},
			setWindowedCanvasSize() {
				if ("undefined" != typeof SDL) {
					var e = k[SDL.screen >> 2];
					e &= -8388609, v[SDL.screen >> 2] = e;
				}
				ze.updateCanvasDimensions(n.canvas), ze.updateResizeListeners();
			},
			updateCanvasDimensions(e, r, t) {
				r && t ? (e.widthNative = r, e.heightNative = t) : (r = e.widthNative, t = e.heightNative);
				var a = r, i = t;
				if (n.forcedAspectRatio && n.forcedAspectRatio > 0 && (a / i < n.forcedAspectRatio ? a = Math.round(i * n.forcedAspectRatio) : i = Math.round(a / n.forcedAspectRatio)), (document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement) === e.parentNode && "undefined" != typeof screen) {
					var o = Math.min(screen.width / a, screen.height / i);
					a = Math.round(a * o), i = Math.round(i * o);
				}
				ze.resizeCanvas ? (e.width != a && (e.width = a), e.height != i && (e.height = i), void 0 !== e.style && (e.style.removeProperty("width"), e.style.removeProperty("height"))) : (e.width != r && (e.width = r), e.height != t && (e.height = t), void 0 !== e.style && (a != r || i != t ? (e.style.setProperty("width", a + "px", "important"), e.style.setProperty("height", i + "px", "important")) : (e.style.removeProperty("width"), e.style.removeProperty("height"))));
			}
		}, xe = [], Te = (e) => {
			var r = xe[e];
			return r || (e >= xe.length && (xe.length = e + 1), xe[e] = r = ae.get(e)), r;
		}, Re = (e) => {
			var r = (e - d.buffer.byteLength + 65535) / 65536;
			try {
				return d.grow(r), T(), 1;
			} catch (t) {}
		};
		class Le {
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
		var Fe = {
			openDatabase(e, r, t, a) {
				try {
					var n = indexedDB.open(e, r);
				} catch (i) {
					return a(i);
				}
				n.onupgradeneeded = (e) => {
					var r = e.target.result;
					r.objectStoreNames.contains("FILES") && r.deleteObjectStore("FILES"), r.createObjectStore("FILES");
				}, n.onsuccess = (e) => t(e.target.result), n.onerror = a;
			},
			init() {
				Fe.xhrs = new Le(), D(), Fe.openDatabase("emscripten_filesystem", 1, (e) => {
					Fe.dbInstance = e, B();
				}, () => {
					Fe.dbInstance = !1, B();
				});
			}
		};
		function Me(e, r, t, a, n) {
			var i = k[e + 8 >> 2];
			if (i) {
				var o = le(i), s = e + 112, _ = le(s + 0);
				_ ||= "GET";
				var c = k[s + 56 >> 2], l = k[s + 68 >> 2], p = k[s + 72 >> 2], u = k[s + 76 >> 2], d = k[s + 80 >> 2], m = k[s + 84 >> 2], f = k[s + 88 >> 2], h = k[s + 52 >> 2], b = !!(1 & h), g = !!(2 & h), v = !!(64 & h), E = l ? le(l) : void 0, A = p ? le(p) : void 0, z = new XMLHttpRequest();
				if (z.withCredentials = !!w[s + 60 | 0], z.open(_, o, !v, E, A), v || (z.timeout = c), z.url_ = o, z.responseType = "arraybuffer", d) {
					var x = le(d);
					z.overrideMimeType(x);
				}
				if (u) for (;;) {
					var T = k[u >> 2];
					if (!T) break;
					var R = k[u + 4 >> 2];
					if (!R) break;
					u += 8;
					var L = le(T), F = le(R);
					z.setRequestHeader(L, F);
				}
				var M = Fe.xhrs.allocate(z);
				k[e >> 2] = M;
				var S = m && f ? w.slice(m, m + f) : null;
				z.onload = (a) => {
					Fe.xhrs.has(M) && (P(), z.status >= 200 && z.status < 300 ? r?.(e, z, a) : t?.(e, z, a));
				}, z.onerror = (r) => {
					Fe.xhrs.has(M) && (P(), t?.(e, z, r));
				}, z.ontimeout = (r) => {
					Fe.xhrs.has(M) && t?.(e, z, r);
				}, z.onprogress = (r) => {
					if (Fe.xhrs.has(M)) {
						var t = b && g && z.response ? z.response.byteLength : 0, n = 0;
						t > 0 && b && g && (n = Je(t), w.set(new Uint8Array(z.response), n)), k[e + 12 >> 2] = n, Se(e + 16, t), Se(e + 24, r.loaded - t), Se(e + 32, r.total), y[e + 40 >> 1] = z.readyState, z.readyState >= 3 && 0 === z.status && r.loaded > 0 && (z.status = 200), y[e + 42 >> 1] = z.status, z.statusText && ue(z.statusText, e + 44, 64), a?.(e, z, r), n && Qe(n);
					}
				}, z.onreadystatechange = (r) => {
					Fe.xhrs.has(M) && (y[e + 40 >> 1] = z.readyState, z.readyState >= 2 && (y[e + 42 >> 1] = z.status), n?.(e, z, r));
				};
				try {
					z.send(S);
				} catch (I) {
					t?.(e, z, I);
				}
			} else t(e, 0, "no url specified!");
			function P() {
				var r = 0, t = 0;
				z.response && b && 0 === k[e + 12 >> 2] && (t = z.response.byteLength), t > 0 && (r = Je(t), w.set(new Uint8Array(z.response), r)), k[e + 12 >> 2] = r, Se(e + 16, t), Se(e + 24, 0);
				var a = z.response ? z.response.byteLength : 0;
				a && Se(e + 32, a), y[e + 40 >> 1] = z.readyState, y[e + 42 >> 1] = z.status, z.statusText && ue(z.statusText, e + 44, 64);
			}
		}
		var Se = (e, r) => {
			k[e >> 2] = r;
			var t = k[e >> 2];
			k[e + 4 >> 2] = (r - t) / 4294967296;
		};
		function Pe(e, r, t, a, n) {
			if (e) {
				var i = k[r + 112 + 64 >> 2];
				i ||= k[r + 8 >> 2];
				var o = le(i);
				try {
					var s = e.transaction(["FILES"], "readwrite").objectStore("FILES").put(t, o);
					s.onsuccess = (e) => {
						y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, ue("OK", r + 44, 64), a(r, 0, o);
					}, s.onerror = (e) => {
						y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 413, ue("Payload Too Large", r + 44, 64), n(r, 0, e);
					};
				} catch (_) {
					n(r, 0, _);
				}
			} else n(r, 0, "IndexedDB not available!");
		}
		var Ie = {}, Oe = () => {
			if (!Oe.strings) {
				var e = {
					USER: "web_user",
					LOGNAME: "web_user",
					PATH: "/",
					PWD: "/",
					HOME: "/home/web_user",
					LANG: ("object" == typeof navigator && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8",
					_: c || "./this.program"
				};
				for (var r in Ie) void 0 === Ie[r] ? delete e[r] : e[r] = Ie[r];
				var t = [];
				for (var r in e) t.push(`${r}=${e[r]}`);
				Oe.strings = t;
			}
			return Oe.strings;
		}, Ce = {
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
				Ce.lastError || (Ce.lastError = e);
			},
			getNewId: (e) => {
				for (var r = Ce.counter++, t = e.length; t < r; t++) e[t] = null;
				return r;
			},
			getSource: (e, r, t, a) => {
				for (var n = "", i = 0; i < r; ++i) {
					var o = a ? k[a + 4 * i >> 2] : void 0;
					n += le(k[t + 4 * i >> 2], o);
				}
				return n;
			},
			createContext: (e, r) => {
				e.getContextSafariWebGL2Fixed || (e.getContextSafariWebGL2Fixed = e.getContext, e.getContext = function(r, t) {
					var a = e.getContextSafariWebGL2Fixed(r, t);
					return "webgl" == r == a instanceof WebGLRenderingContext ? a : null;
				});
				var t = e.getContext("webgl", r);
				return t ? Ce.registerContext(t, r) : 0;
			},
			registerContext: (e, r) => {
				var t = Ce.getNewId(Ce.contexts), a = {
					handle: t,
					attributes: r,
					version: r.majorVersion,
					GLctx: e
				};
				return e.canvas && (e.canvas.GLctxObject = a), Ce.contexts[t] = a, (void 0 === r.enableExtensionsByDefault || r.enableExtensionsByDefault) && Ce.initExtensions(a), t;
			},
			makeContextCurrent: (e) => (Ce.currentContext = Ce.contexts[e], n.ctx = Ye = Ce.currentContext?.GLctx, !(e && !Ye)),
			getContext: (e) => Ce.contexts[e],
			deleteContext: (e) => {
				Ce.currentContext === Ce.contexts[e] && (Ce.currentContext = null), "object" == typeof JSEvents && JSEvents.removeAllHandlersOnTarget(Ce.contexts[e].GLctx.canvas), Ce.contexts[e] && Ce.contexts[e].GLctx.canvas && (Ce.contexts[e].GLctx.canvas.GLctxObject = void 0), Ce.contexts[e] = null;
			},
			initExtensions: (e) => {
				if (e ||= Ce.currentContext, !e.initExtensionsDone) {
					e.initExtensionsDone = !0;
					var r = e.GLctx;
					((e) => {
						var r = e.getExtension("ANGLE_instanced_arrays");
						r && (e.vertexAttribDivisor = (e, t) => r.vertexAttribDivisorANGLE(e, t), e.drawArraysInstanced = (e, t, a, n) => r.drawArraysInstancedANGLE(e, t, a, n), e.drawElementsInstanced = (e, t, a, n, i) => r.drawElementsInstancedANGLE(e, t, a, n, i));
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
		}, De = (e, r, t, a, n, i) => {
			var o = ((e) => 1 == (e -= 5120) ? w : 4 == e ? v : 6 == e ? E : 5 == e || 28922 == e ? k : y)(e), s = ((e) => 31 - Math.clz32(e.BYTES_PER_ELEMENT))(o), _ = 1 << s, c = ((e, r, t, a) => {
				return r * (e * t + (n = a) - 1 & -n);
				var n;
			})(t, a, ((e) => ({
				5: 3,
				6: 4,
				8: 2,
				29502: 3,
				29504: 4
			})[e - 6402] || 1)(r) * _, Ce.unpackAlignment);
			return o.subarray(n >> s, n + c >> s);
		}, Be = [
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
		], Ne = [
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
		], Ue = (e, r) => {
			b.set(e, r);
		}, Ve = (e, r, t, a) => {
			var n = k[a + 40 >> 2], i = {
				tm_sec: v[a >> 2],
				tm_min: v[a + 4 >> 2],
				tm_hour: v[a + 8 >> 2],
				tm_mday: v[a + 12 >> 2],
				tm_mon: v[a + 16 >> 2],
				tm_year: v[a + 20 >> 2],
				tm_wday: v[a + 24 >> 2],
				tm_yday: v[a + 28 >> 2],
				tm_isdst: v[a + 32 >> 2],
				tm_gmtoff: v[a + 36 >> 2],
				tm_zone: n ? le(n) : ""
			}, o = le(t), s = {
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
			for (var _ in s) o = o.replace(new RegExp(_, "g"), s[_]);
			var c = [
				"Sunday",
				"Monday",
				"Tuesday",
				"Wednesday",
				"Thursday",
				"Friday",
				"Saturday"
			], l = [
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
			function u(e, r) {
				return p(e, r, "0");
			}
			function d(e, r) {
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
						var a = me(t.getFullYear()), n = t.getMonth(), i = (a ? Be : Ne)[n];
						if (!(r > i - t.getDate())) return t.setDate(t.getDate() + r), t;
						r -= i - t.getDate() + 1, t.setDate(1), n < 11 ? t.setMonth(n + 1) : (t.setMonth(0), t.setFullYear(t.getFullYear() + 1));
					}
					return t;
				})(new Date(e.tm_year + 1900, 0, 1), e.tm_yday), t = new Date(r.getFullYear(), 0, 4), a = new Date(r.getFullYear() + 1, 0, 4), n = m(t), i = m(a);
				return d(n, r) <= 0 ? d(i, r) <= 0 ? r.getFullYear() + 1 : r.getFullYear() : r.getFullYear() - 1;
			}
			var h = {
				"%a": (e) => c[e.tm_wday].substring(0, 3),
				"%A": (e) => c[e.tm_wday],
				"%b": (e) => l[e.tm_mon].substring(0, 3),
				"%B": (e) => l[e.tm_mon],
				"%C": (e) => u((e.tm_year + 1900) / 100 | 0, 2),
				"%d": (e) => u(e.tm_mday, 2),
				"%e": (e) => p(e.tm_mday, 2, " "),
				"%g": (e) => f(e).toString().substring(2),
				"%G": f,
				"%H": (e) => u(e.tm_hour, 2),
				"%I": (e) => {
					var r = e.tm_hour;
					return 0 == r ? r = 12 : r > 12 && (r -= 12), u(r, 2);
				},
				"%j": (e) => u(e.tm_mday + ((e, r) => {
					for (var t = 0, a = 0; a <= r; t += e[a++]);
					return t;
				})(me(e.tm_year + 1900) ? Be : Ne, e.tm_mon - 1), 3),
				"%m": (e) => u(e.tm_mon + 1, 2),
				"%M": (e) => u(e.tm_min, 2),
				"%n": () => "\n",
				"%p": (e) => e.tm_hour >= 0 && e.tm_hour < 12 ? "AM" : "PM",
				"%S": (e) => u(e.tm_sec, 2),
				"%t": () => "	",
				"%u": (e) => e.tm_wday || 7,
				"%U": (e) => {
					var r = e.tm_yday + 7 - e.tm_wday;
					return u(Math.floor(r / 7), 2);
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
					return u(r, 2);
				},
				"%w": (e) => e.tm_wday,
				"%W": (e) => {
					var r = e.tm_yday + 7 - (e.tm_wday + 6) % 7;
					return u(Math.floor(r / 7), 2);
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
			for (var _ in o = o.replace(/%%/g, "\0\0"), h) o.includes(_) && (o = o.replace(new RegExp(_, "g"), h[_](i)));
			var b = te(o = o.replace(/\0\0/g, "%"), !1);
			return b.length > r ? 0 : (Ue(b, e), b.length - 1);
		}, Ge = (e) => n["_" + e], He = (e, r, t, a, n) => {
			var i = {
				string: (e) => {
					var r = 0;
					return null != e && 0 !== e && (r = ((e) => {
						var r = ee(e) + 1, t = nr(r);
						return ue(e, t, r), t;
					})(e)), r;
				},
				array: (e) => {
					var r = nr(e.length);
					return Ue(e, r), r;
				}
			}, o = Ge(e), s = [], _ = 0;
			if (a) for (var c = 0; c < a.length; c++) {
				var l = i[t[c]];
				l ? (0 === _ && (_ = tr()), s[c] = l(a[c])) : s[c] = a[c];
			}
			var p = o.apply(null, s);
			return p = function(e) {
				return 0 !== _ && ar(_), function(e) {
					return "string" === r ? le(e) : "boolean" === r ? Boolean(e) : e;
				}(e);
			}(p);
		}, Xe = function(e, r, t, a) {
			e || (e = this), this.parent = e, this.mount = e.mount, this.mounted = null, this.id = ce.nextInode++, this.name = r, this.mode = t, this.node_ops = {}, this.stream_ops = {}, this.rdev = a;
		}, We = 365, qe = 146;
		Object.defineProperties(Xe.prototype, {
			read: {
				get: function() {
					return (this.mode & We) === We;
				},
				set: function(e) {
					e ? this.mode |= We : this.mode &= -366;
				}
			},
			write: {
				get: function() {
					return (this.mode & qe) === qe;
				},
				set: function(e) {
					e ? this.mode |= qe : this.mode &= -147;
				}
			},
			isFolder: { get: function() {
				return ce.isDir(this.mode);
			} },
			isDevice: { get: function() {
				return ce.isChrdev(this.mode);
			} }
		}), ce.FSNode = Xe, ce.createPreloadedFile = (e, r, t, a, n, i, s, _, c, l) => {
			var p = r ? K.resolve(j.join2(e, r)) : e;
			function u(t) {
				function o(t) {
					l?.(), _ || ((e, r, t, a, n, i) => {
						ce.createDataFile(e, r, t, a, n, i);
					})(e, r, t, a, n, c), i?.(), B();
				}
				((e, r, t, a) => {
					void 0 !== ze && ze.init();
					var n = !1;
					return se.forEach((i) => {
						n || i.canHandle(r) && (i.handle(e, r, t, a), n = !0);
					}), n;
				})(t, p, o, () => {
					s?.(), B();
				}) || o(t);
			}
			D(), "string" == typeof t ? ((e, r, t, a) => {
				var n = a ? "" : `al ${e}`;
				o(e, (e) => {
					r(new Uint8Array(e)), n && B();
				}, (r) => {
					if (!t) throw `Loading data file "${e}" failed.`;
					t();
				}), n && D();
			})(t, u, s) : u(t);
		}, ce.staticInit(), n.requestFullscreen = ze.requestFullscreen, n.requestAnimationFrame = ze.requestAnimationFrame, n.setCanvasSize = ze.setCanvasSize, n.pauseMainLoop = ze.mainLoop.pause, n.resumeMainLoop = ze.mainLoop.resume, n.getUserMedia = ze.getUserMedia, n.createContext = ze.createContext;
		var Ye, je = {}, Ze = {};
		Fe.init();
		var Ke = {
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
						case 12: return n = pe.getp(), g[n + 0 >> 1] = 2, 0;
					}
					return -28;
				} catch (i) {
					if (void 0 === ce || "ErrnoError" !== i.name) throw i;
					return -i.errno;
				}
			},
			A: function(e, r, t) {
				try {
					var a = pe.getStreamFromFD(e);
					a.getdents ||= ce.readdir(a.path);
					for (var n = 280, i = 0, o = ce.llseek(a, 0, 1), s = Math.floor(o / n); s < a.getdents.length && i + n <= t;) {
						var _, c, l = a.getdents[s];
						if ("." === l) _ = a.node.id, c = 4;
						else if (".." === l) _ = ce.lookupPath(a.path, { parent: !0 }).node.id, c = 4;
						else {
							var p = ce.lookupNode(a.node, l);
							_ = p.id, c = ce.isChrdev(p.mode) ? 2 : ce.isDir(p.mode) ? 4 : ce.isLink(p.mode) ? 10 : 8;
						}
						G = [_ >>> 0, (V = _, +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[r + i >> 2] = G[0], v[r + i + 4 >> 2] = G[1], G = [(s + 1) * n >>> 0, (V = (s + 1) * n, +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[r + i + 8 >> 2] = G[0], v[r + i + 12 >> 2] = G[1], g[r + i + 16 >> 1] = 280, b[r + i + 18 | 0] = c, ue(l, r + i + 19, 256), i += n, s += 1;
					}
					return ce.llseek(a, s * n, 0), i;
				} catch (u) {
					if (void 0 === ce || "ErrnoError" !== u.name) throw u;
					return -u.errno;
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
								var n = a.tty.ops.ioctl_tcgets(a), i = pe.getp();
								v[i >> 2] = n.c_iflag || 0, v[i + 4 >> 2] = n.c_oflag || 0, v[i + 8 >> 2] = n.c_cflag || 0, v[i + 12 >> 2] = n.c_lflag || 0;
								for (var o = 0; o < 32; o++) b[i + o + 17 | 0] = n.c_cc[o] || 0;
								return 0;
							}
							return 0;
						case 21506:
						case 21507:
						case 21508:
							if (!a.tty) return -59;
							if (a.tty.ops.ioctl_tcsets) {
								i = pe.getp();
								var s = v[i >> 2], _ = v[i + 4 >> 2], c = v[i + 8 >> 2], l = v[i + 12 >> 2], p = [];
								for (o = 0; o < 32; o++) p.push(b[i + o + 17 | 0]);
								return a.tty.ops.ioctl_tcsets(a.tty, r, {
									c_iflag: s,
									c_oflag: _,
									c_cflag: c,
									c_lflag: l,
									c_cc: p
								});
							}
							return 0;
						case 21519: return a.tty ? (i = pe.getp(), v[i >> 2] = 0, 0) : -59;
						case 21520: return a.tty ? -28 : -59;
						case 21531: return i = pe.getp(), ce.ioctl(a, r, i);
						case 21523:
							if (!a.tty) return -59;
							if (a.tty.ops.ioctl_tiocgwinsz) {
								var u = a.tty.ops.ioctl_tiocgwinsz(a.tty);
								i = pe.getp(), g[i >> 1] = u[0], g[i + 2 >> 1] = u[1];
							}
							return 0;
						default: return -28;
					}
				} catch (d) {
					if (void 0 === ce || "ErrnoError" !== d.name) throw d;
					return -d.errno;
				}
			},
			i: function(e, r, t, a) {
				pe.varargs = a;
				try {
					r = pe.getStr(r), r = pe.calculateAt(e, r);
					var n = a ? pe.get() : 0;
					return ce.open(r, t, n).fd;
				} catch (i) {
					if (void 0 === ce || "ErrnoError" !== i.name) throw i;
					return -i.errno;
				}
			},
			y: function(e, r, t, a) {
				try {
					if (r = pe.getStr(r), r = pe.calculateAt(e, r), a <= 0) return -28;
					var n = ce.readlink(r), i = Math.min(a, ee(n)), o = b[t + i];
					return ue(n, t, a + 1), b[t + i] = o, i;
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
					return r = pe.getStr(r), r = pe.calculateAt(e, r), 0 === t ? ce.unlink(r) : 512 === t ? ce.rmdir(r) : N("Invalid flags passed to unlinkat"), 0;
				} catch (a) {
					if (void 0 === ce || "ErrnoError" !== a.name) throw a;
					return -a.errno;
				}
			},
			I: function(e) {
				if (Fe.xhrs.has(e)) {
					var r = Fe.xhrs.get(e);
					Fe.xhrs.free(e), r.readyState > 0 && r.readyState < 4 && r.abort();
				}
			},
			F: () => 1,
			q: function(e, r, t) {
				var a = de(e, r), n = /* @__PURE__ */ new Date(1e3 * a);
				v[t >> 2] = n.getUTCSeconds(), v[t + 4 >> 2] = n.getUTCMinutes(), v[t + 8 >> 2] = n.getUTCHours(), v[t + 12 >> 2] = n.getUTCDate(), v[t + 16 >> 2] = n.getUTCMonth(), v[t + 20 >> 2] = n.getUTCFullYear() - 1900, v[t + 24 >> 2] = n.getUTCDay();
				var i = Date.UTC(n.getUTCFullYear(), 0, 1, 0, 0, 0, 0), o = (n.getTime() - i) / 864e5 | 0;
				v[t + 28 >> 2] = o;
			},
			r: function(e, r, t) {
				var a = de(e, r), n = /* @__PURE__ */ new Date(1e3 * a);
				v[t >> 2] = n.getSeconds(), v[t + 4 >> 2] = n.getMinutes(), v[t + 8 >> 2] = n.getHours(), v[t + 12 >> 2] = n.getDate(), v[t + 16 >> 2] = n.getMonth(), v[t + 20 >> 2] = n.getFullYear() - 1900, v[t + 24 >> 2] = n.getDay();
				var i = 0 | ((e) => (me(e.getFullYear()) ? fe : he)[e.getMonth()] + e.getDate() - 1)(n);
				v[t + 28 >> 2] = i, v[t + 36 >> 2] = -60 * n.getTimezoneOffset();
				var o = new Date(n.getFullYear(), 0, 1), s = new Date(n.getFullYear(), 6, 1).getTimezoneOffset(), _ = o.getTimezoneOffset(), c = 0 | (s != _ && n.getTimezoneOffset() == Math.min(_, s));
				v[t + 32 >> 2] = c;
			},
			x: (e, r, t) => {
				var a = (/* @__PURE__ */ new Date()).getFullYear(), n = new Date(a, 0, 1), i = new Date(a, 6, 1), o = n.getTimezoneOffset(), s = i.getTimezoneOffset(), _ = Math.max(o, s);
				function c(e) {
					var r = e.toTimeString().match(/\(([A-Za-z ]+)\)$/);
					return r ? r[1] : "GMT";
				}
				k[e >> 2] = 60 * _, v[r >> 2] = Number(o != s);
				var l = c(n), p = c(i), u = be(l), d = be(p);
				s < o ? (k[t >> 2] = u, k[t + 4 >> 2] = d) : (k[t >> 2] = d, k[t + 4 >> 2] = u);
			},
			b: () => {
				N("");
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
				var t = ee(e) + 1, a = Je(t);
				return ue(e, a, t + 1), a;
			},
			o: function() {
				self.postMessage({ t: "licerr" });
			},
			h: (e, r, t) => {
				function a() {
					Te(e)(r);
				}
				t >= 0 ? ke(a, t) : ze.safeRequestAnimationFrame(a);
			},
			f: () => Date.now(),
			t: () => 2147483648,
			E: Ae,
			K: () => !1,
			G: (e, r, t) => w.copyWithin(e, r, r + t),
			v: (e) => {
				var r = w.length, t = 2147483648;
				if ((e >>>= 0) > t) return !1;
				for (var a = (e, r) => e + (r - e % r) % r, n = 1; n <= 4; n *= 2) {
					var i = r * (1 + .2 / n);
					if (i = Math.min(i, e + 100663296), Re(Math.min(t, a(Math.max(e, i), 65536)))) return !0;
				}
				return !1;
			},
			J: function(e, r, t, a, n) {
				var i = e + 112, o = k[i + 36 >> 2], s = k[i + 40 >> 2], _ = k[i + 44 >> 2], c = k[i + 48 >> 2], l = k[i + 52 >> 2], p = !!(64 & l);
				function u(e) {
					p ? e() : ve(e);
				}
				var d = (e, t, a) => {
					u(() => {
						o ? Te(o)(e) : r?.(e);
					});
				}, m = (e, r, t) => {
					u(() => {
						_ ? Te(_)(e) : a?.(e);
					});
				}, f = (e, r, a) => {
					u(() => {
						s ? Te(s)(e) : t?.(e);
					});
				}, h = (e, r, t) => {
					u(() => {
						c ? Te(c)(e) : n?.(e);
					});
				}, b = (e, t, a) => {
					Pe(Fe.dbInstance, e, t.response, (e, t, a) => {
						u(() => {
							o ? Te(o)(e) : r?.(e);
						});
					}, (e, t, a) => {
						u(() => {
							o ? Te(o)(e) : r?.(e);
						});
					});
				}, g = le(i + 0), v = !!(16 & l), E = !!(4 & l), A = !!(32 & l);
				if ("EM_IDB_STORE" === g) {
					var z = k[i + 84 >> 2], x = k[i + 88 >> 2];
					Pe(Fe.dbInstance, e, w.slice(z, z + x), d, f);
				} else if ("EM_IDB_DELETE" === g) (function(e, r, t, a) {
					if (e) {
						var n = k[r + 112 + 64 >> 2];
						n ||= k[r + 8 >> 2];
						var i = le(n);
						try {
							var o = e.transaction(["FILES"], "readwrite").objectStore("FILES").delete(i);
							o.onsuccess = (e) => {
								var a = e.target.result;
								k[r + 12 >> 2] = 0, Se(r + 16, 0), Se(r + 24, 0), Se(r + 32, 0), y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, ue("OK", r + 44, 64), t(r, 0, a);
							}, o.onerror = (e) => {
								y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, ue("Not Found", r + 44, 64), a(r, 0, e);
							};
						} catch (s) {
							a(r, 0, s);
						}
					} else a(r, 0, "IndexedDB not available!");
				})(Fe.dbInstance, e, d, f);
				else if (v) {
					if (A) return 0;
					Me(e, E ? b : d, f, m, h);
				} else (function(e, r, t, a) {
					if (e) {
						var n = k[r + 112 + 64 >> 2];
						n ||= k[r + 8 >> 2];
						var i = le(n);
						try {
							var o = e.transaction(["FILES"], "readonly").objectStore("FILES").get(i);
							o.onsuccess = (e) => {
								if (e.target.result) {
									var n = e.target.result, i = n.byteLength || n.length, o = Je(i);
									w.set(new Uint8Array(n), o), k[r + 12 >> 2] = o, Se(r + 16, i), Se(r + 24, 0), Se(r + 32, i), y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 200, ue("OK", r + 44, 64), t(r, 0, n);
								} else y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, ue("Not Found", r + 44, 64), a(r, 0, "no data");
							}, o.onerror = (e) => {
								y[r + 40 >> 1] = 4, y[r + 42 >> 1] = 404, ue("Not Found", r + 44, 64), a(r, 0, e);
							};
						} catch (s) {
							a(r, 0, s);
						}
					} else a(r, 0, "IndexedDB not available!");
				})(Fe.dbInstance, e, d, A ? f : E ? (e, r, t) => {
					Me(e, b, f, m, h);
				} : (e, r, t) => {
					Me(e, d, f, m, h);
				});
				return e;
			},
			B: (e, r) => {
				var t = 0;
				return Oe().forEach((a, n) => {
					var i = r + t;
					k[e + 4 * n >> 2] = i, ((e, r) => {
						for (var t = 0; t < e.length; ++t) b[0 | r++] = e.charCodeAt(t);
						b[0 | r] = 0;
					})(a, i), t += a.length + 1;
				}), 0;
			},
			C: (e, r) => {
				var t = Oe();
				k[e >> 2] = t.length;
				var a = 0;
				return t.forEach((e) => a += e.length + 1), k[r >> 2] = a, 0;
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
						for (var n = 0, i = 0; i < t; i++) {
							var o = k[r >> 2], s = k[r + 4 >> 2];
							r += 8;
							var _ = ce.read(e, b, o, s, a);
							if (_ < 0) return -1;
							if (n += _, _ < s) break;
							void 0 !== a && (a += _);
						}
						return n;
					})(pe.getStreamFromFD(e), r, t);
					return k[a >> 2] = n, 0;
				} catch (i) {
					if (void 0 === ce || "ErrnoError" !== i.name) throw i;
					return i.errno;
				}
			},
			s: function(e, r, t, a, n) {
				var i = de(r, t);
				try {
					if (isNaN(i)) return 61;
					var o = pe.getStreamFromFD(e);
					return ce.llseek(o, i, a), G = [o.position >>> 0, (V = o.position, +Math.abs(V) >= 1 ? V > 0 ? +Math.floor(V / 4294967296) >>> 0 : ~~+Math.ceil((V - +(~~V >>> 0)) / 4294967296) >>> 0 : 0)], v[n >> 2] = G[0], v[n + 4 >> 2] = G[1], o.getdents && 0 === i && 0 === a && (o.getdents = null), 0;
				} catch (s) {
					if (void 0 === ce || "ErrnoError" !== s.name) throw s;
					return s.errno;
				}
			},
			g: function(e, r, t, a) {
				try {
					var n = ((e, r, t, a) => {
						for (var n = 0, i = 0; i < t; i++) {
							var o = k[r >> 2], s = k[r + 4 >> 2];
							r += 8;
							var _ = ce.write(e, b, o, s, a);
							if (_ < 0) return -1;
							n += _, void 0 !== a && (a += _);
						}
						return n;
					})(pe.getStreamFromFD(e), r, t);
					return k[a >> 2] = n, 0;
				} catch (i) {
					if (void 0 === ce || "ErrnoError" !== i.name) throw i;
					return i.errno;
				}
			},
			k: (e, r) => {
				Ye.bindTexture(e, Ce.textures[r]);
			},
			l: (e, r) => {
				((e, r, t, a) => {
					for (var n = 0; n < e; n++) {
						var i = Ye[t](), o = i && Ce.getNewId(a);
						i ? (i.name = o, a[o] = i) : Ce.recordError(1282), v[r + 4 * n >> 2] = o;
					}
				})(e, r, "createTexture", Ce.textures);
			},
			d: (e, r, t, a, n, i, o, s, _) => {
				Ye.texImage2D(e, r, t, a, n, i, o, s, _ ? De(s, o, a, n, _) : null);
			},
			e: function(e, r, t) {
				Ye.texParameteri(e, r, t);
			},
			u: (e, r, t, a, n) => Ve(e, r, t, a)
		}, $e = function() {
			var e = { a: Ke };
			function r(e, r) {
				var t;
				return $e = e.exports, d = $e.L, T(), ae = $e.Q, t = $e.M, L.unshift(t), B(), $e;
			}
			if (D(), n.instantiateWasm) try {
				return n.instantiateWasm(e, r);
			} catch (t) {
				f(`Module.instantiateWasm callback failed with error: ${t}`), a(t);
			}
			return r(X(H, e)[0]);
		}();
		$e.M, n._zappar_has_initialized = $e.N, n._zappar_invert = $e.O, n._zappar_loaded = $e.P, n._zappar_pipeline_create = $e.R, n._zappar_pipeline_destroy = $e.S, n._zappar_pipeline_camera_frame_submit = $e.T, n._zappar_pipeline_camera_frame_submit_raw_pointer = $e.U, n._zappar_pipeline_frame_update = $e.V, n._zappar_pipeline_camera_frame_user_data = $e.W, n._zappar_pipeline_camera_model = $e.X, n._zappar_pipeline_camera_data_width = $e.Y, n._zappar_pipeline_camera_data_height = $e.Z, n._zappar_pipeline_camera_frame_sharpness = $e._, n._zappar_pipeline_camera_frame_sharpness_enabled_set = $e.$, n._zappar_pipeline_frame_number = $e.aa, n._zappar_pipeline_camera_frame_data_raw_size = $e.ba, n._zappar_pipeline_camera_frame_data_raw = $e.ca, n._zappar_pipeline_motion_accelerometer_submit = $e.da, n._zappar_pipeline_motion_accelerometer_with_gravity_submit_int = $e.ea, n._zappar_pipeline_motion_accelerometer_without_gravity_submit_int = $e.fa, n._zappar_pipeline_motion_rotation_rate_submit_int = $e.ga, n._zappar_pipeline_motion_attitude_submit_int = $e.ha, n._zappar_pipeline_motion_relative_orientation_submit_int = $e.ia, n._zappar_pipeline_motion_rotation_rate_submit = $e.ja, n._zappar_pipeline_motion_attitude_submit = $e.ka, n._zappar_pipeline_motion_attitude_matrix_submit = $e.la, n._zappar_pipeline_camera_frame_user_facing = $e.ma, n._zappar_pipeline_camera_frame_texture_matrix = $e.na, n._zappar_pipeline_camera_pose_with_attitude = $e.oa, n._zappar_pipeline_camera_pose_with_origin = $e.pa, n._zappar_pipeline_camera_frame_camera_attitude = $e.qa, n._zappar_pipeline_camera_frame_device_attitude = $e.ra, n._zappar_pipeline_camera_frame_texture_gl = $e.sa, n._zappar_pipeline_camera_frame_upload_gl = $e.ta, n._zappar_pipeline_sequence_record_start = $e.ua, n._zappar_pipeline_sequence_record_stop = $e.va, n._zappar_pipeline_sequence_record_clear = $e.wa, n._zappar_pipeline_sequence_record_device_attitude_matrices_set = $e.xa, n._zappar_pipeline_sequence_record_data_size = $e.ya, n._zappar_pipeline_sequence_record_data = $e.za, n._zappar_pipeline_process_gl = $e.Aa, n._zappar_pipeline_camera_pose_default = $e.Ba, n._zappar_instant_world_tracker_create = $e.Ca, n._zappar_instant_world_tracker_destroy = $e.Da, n._zappar_instant_world_tracker_anchor_pose_set_from_camera_offset_raw = $e.Ea, n._zappar_instant_world_tracker_anchor_pose_raw = $e.Fa, n._zappar_instant_world_tracker_enabled_set = $e.Ga, n._zappar_instant_world_tracker_enabled = $e.Ha, n._zappar_custom_anchor_create = $e.Ia, n._zappar_custom_anchor_destroy = $e.Ja, n._zappar_custom_anchor_pose_set_from_camera_offset_raw = $e.Ka, n._zappar_custom_anchor_pose_set_from_anchor_offset = $e.La, n._zappar_custom_anchor_pose_set_with_parent = $e.Ma, n._zappar_custom_anchor_pose_set = $e.Na, n._zappar_custom_anchor_pose_version = $e.Oa, n._zappar_custom_anchor_pose_raw = $e.Pa, n._zappar_custom_anchor_id = $e.Qa, n._zappar_custom_anchor_status = $e.Ra, n._zappar_image_tracker_create = $e.Sa, n._zappar_image_tracker_destroy = $e.Ta, n._zappar_image_tracker_target_load_from_memory = $e.Ua, n.__Z42zappar_image_tracker_target_load_from_fileP23zappar_image_tracker_tiPKc = $e.Va;
		var Qe = n._free = $e.Wa;
		n._zappar_image_tracker_anchor_count = $e.Xa, n._zappar_image_tracker_anchor_id = $e.Ya, n._zappar_image_tracker_anchor_pose_raw = $e.Za, n._zappar_image_tracker_enabled_set = $e._a, n._zappar_image_tracker_enabled = $e.$a, n._zappar_image_tracker_target_loaded_version = $e.ab, n.__Z33zappar_image_tracker_target_countP23zappar_image_tracker_ti = $e.bb, n.__Z46zappar_image_tracker_target_preview_compressedP23zappar_image_tracker_tii = $e.cb, n.__Z51zappar_image_tracker_target_preview_compressed_sizeP23zappar_image_tracker_tii = $e.db, n.__Z55zappar_image_tracker_target_preview_compressed_mimetypeP23zappar_image_tracker_tii = $e.eb, n.__Z40zappar_image_tracker_target_preview_rgbaP23zappar_image_tracker_tii = $e.fb, n.__Z45zappar_image_tracker_target_preview_rgba_sizeP23zappar_image_tracker_tii = $e.gb, n.__Z46zappar_image_tracker_target_preview_rgba_widthP23zappar_image_tracker_tii = $e.hb, n.__Z47zappar_image_tracker_target_preview_rgba_heightP23zappar_image_tracker_tii = $e.ib, n.__Z38zappar_image_tracker_target_radius_topP23zappar_image_tracker_tii = $e.jb, n.__Z41zappar_image_tracker_target_radius_bottomP23zappar_image_tracker_tii = $e.kb, n.__Z39zappar_image_tracker_target_side_lengthP23zappar_image_tracker_tii = $e.lb, n.__Z49zappar_image_tracker_target_physical_scale_factorP23zappar_image_tracker_tii = $e.mb, n.__Z49zappar_image_tracker_target_preview_mesh_verticesP23zappar_image_tracker_tii = $e.nb, n.__Z48zappar_image_tracker_target_preview_mesh_normalsP23zappar_image_tracker_tii = $e.ob, n.__Z44zappar_image_tracker_target_preview_mesh_uvsP23zappar_image_tracker_tii = $e.pb, n.__Z48zappar_image_tracker_target_preview_mesh_indicesP23zappar_image_tracker_tii = $e.qb, n.__Z54zappar_image_tracker_target_preview_mesh_vertices_sizeP23zappar_image_tracker_tii = $e.rb, n.__Z53zappar_image_tracker_target_preview_mesh_normals_sizeP23zappar_image_tracker_tii = $e.sb, n.__Z49zappar_image_tracker_target_preview_mesh_uvs_sizeP23zappar_image_tracker_tii = $e.tb, n.__Z53zappar_image_tracker_target_preview_mesh_indices_sizeP23zappar_image_tracker_tii = $e.ub, n.__Z32zappar_image_tracker_target_typeP23zappar_image_tracker_tii = $e.vb, n._zappar_face_tracker_create = $e.wb, n._zappar_face_tracker_destroy = $e.xb, n._zappar_face_tracker_model_load_from_memory = $e.yb, n._zappar_face_tracker_anchor_count = $e.zb, n._zappar_face_tracker_anchor_id = $e.Ab, n._zappar_face_tracker_anchor_pose_raw = $e.Bb, n._zappar_face_tracker_anchor_identity_coefficients = $e.Cb, n._zappar_face_tracker_anchor_expression_coefficients = $e.Db, n._zappar_face_tracker_enabled_set = $e.Eb, n._zappar_face_tracker_enabled = $e.Fb, n._zappar_face_tracker_max_faces_set = $e.Gb, n._zappar_face_tracker_max_faces = $e.Hb, n._zappar_face_tracker_model_loaded_version = $e.Ib, n._zappar_face_landmark_create = $e.Jb, n._zappar_face_landmark_destroy = $e.Kb, n.__Z27zappar_face_landmark_updateP23zappar_face_landmark_tiPKfS2_i = $e.Lb, n._zappar_face_landmark_anchor_pose = $e.Mb, n._zappar_barcode_finder_create = $e.Nb, n._zappar_barcode_finder_destroy = $e.Ob, n._zappar_barcode_finder_found_number = $e.Pb, n._zappar_barcode_finder_found_text = $e.Qb, n._zappar_barcode_finder_enabled_set = $e.Rb, n._zappar_barcode_finder_enabled = $e.Sb, n._zappar_barcode_finder_found_format = $e.Tb, n._zappar_barcode_finder_formats = $e.Ub, n._zappar_barcode_finder_formats_set = $e.Vb, n._zappar_zapcode_tracker_create = $e.Wb, n._zappar_zapcode_tracker_destroy = $e.Xb, n._zappar_zapcode_tracker_target_load_from_memory = $e.Yb, n.__Z44zappar_zapcode_tracker_target_load_from_fileP25zappar_zapcode_tracker_tiPKc = $e.Zb, n._zappar_zapcode_tracker_anchor_count = $e._b, n._zappar_zapcode_tracker_anchor_id = $e.$b, n._zappar_zapcode_tracker_anchor_pose_raw = $e.ac, n._zappar_zapcode_tracker_enabled_set = $e.bc, n._zappar_zapcode_tracker_enabled = $e.cc, n._zappar_zapcode_tracker_target_loaded_version = $e.dc;
		var Je = n._malloc = $e.ec;
		n._zappar_face_mesh_create = $e.fc, n._zappar_face_mesh_destroy = $e.gc, n.__Z33zappar_face_mesh_load_from_memoryP19zappar_face_mesh_tiPKciiiii = $e.hc, n.__Z29zappar_face_mesh_indices_sizeP19zappar_face_mesh_ti = $e.ic, n.__Z25zappar_face_mesh_uvs_sizeP19zappar_face_mesh_ti = $e.jc, n.__Z30zappar_face_mesh_vertices_sizeP19zappar_face_mesh_ti = $e.kc, n.__Z31zappar_face_mesh_loaded_versionP19zappar_face_mesh_ti = $e.lc, n.__Z25zappar_face_mesh_verticesP19zappar_face_mesh_ti = $e.mc, n.__Z20zappar_face_mesh_uvsP19zappar_face_mesh_ti = $e.nc, n.__Z24zappar_face_mesh_indicesP19zappar_face_mesh_ti = $e.oc, n.__Z23zappar_face_mesh_updateP19zappar_face_mesh_tiPKfS2_i = $e.pc, n.__Z29zappar_face_mesh_normals_sizeP19zappar_face_mesh_ti = $e.qc, n.__Z24zappar_face_mesh_normalsP19zappar_face_mesh_ti = $e.rc, n._zappar_camera_source_create = $e.sc, n._zappar_camera_source_destroy = $e.tc, n._zappar_camera_source_start = $e.uc, n._zappar_camera_source_pause = $e.vc, n._zappar_camera_default_device_id = $e.wc, n._zappar_sequence_source_create = $e.xc, n.__Z28zappar_sequence_source_startP25zappar_sequence_source_ti = $e.yc, n.__Z39zappar_sequence_source_load_from_memoryP25zappar_sequence_source_tiPKci = $e.zc, n.__Z28zappar_sequence_source_pauseP25zappar_sequence_source_ti = $e.Ac, n._zappar_sequence_source_destroy = $e.Bc, n._zappar_sequence_source_max_playback_fps_set = $e.Cc, n._zappar_log_level_set = $e.Dc, n._zappar_log_level = $e.Ec, n.__Z23zappar_log_redirect_setPFv18zappar_log_level_tPKcE = $e.Fc, n._zappar_world_tracker_create = $e.Gc, n._zappar_world_tracker_destroy = $e.Hc, n._zappar_world_tracker_world_anchor_status = $e.Ic, n._zappar_world_tracker_world_anchor_id = $e.Jc, n._zappar_world_tracker_plane_anchor_count = $e.Kc, n._zappar_world_tracker_plane_anchor_id = $e.Lc, n._zappar_world_tracker_plane_anchor_pose_raw = $e.Mc, n._zappar_world_tracker_world_anchor_pose_raw = $e.Nc, n._zappar_world_tracker_ground_anchor_status = $e.Oc, n._zappar_world_tracker_ground_anchor_id = $e.Pc, n._zappar_world_tracker_ground_anchor_pose_raw = $e.Qc, n._zappar_world_tracker_reset = $e.Rc, n._zappar_world_tracker_enabled_set = $e.Sc, n._zappar_world_tracker_enabled = $e.Tc, n._zappar_world_tracker_scale_mode_set = $e.Uc, n._zappar_world_tracker_scale_mode = $e.Vc, n._zappar_world_tracker_session_number = $e.Wc, n._zappar_world_tracker_quality = $e.Xc, n._zappar_world_tracker_tracks_data_enabled = $e.Yc, n._zappar_world_tracker_projections_data_enabled = $e.Zc, n._zappar_world_tracker_tracks_data_enabled_set = $e._c, n._zappar_world_tracker_projections_data_enabled_set = $e.$c, n._zappar_world_tracker_tracks_data = $e.ad, n._zappar_world_tracker_tracks_data_size = $e.bd, n._zappar_world_tracker_tracks_type_data = $e.cd, n._zappar_world_tracker_tracks_type_data_size = $e.dd, n._zappar_world_tracker_projections_data = $e.ed, n._zappar_world_tracker_projections_data_size = $e.fd, n._zappar_world_tracker_horizontal_plane_detection_enabled = $e.gd, n._zappar_world_tracker_horizontal_plane_detection_enabled_set = $e.hd, n._zappar_world_tracker_vertical_plane_detection_enabled = $e.id, n._zappar_world_tracker_vertical_plane_detection_enabled_set = $e.jd, n._zappar_world_tracker_vertical_plane_detection_supported = $e.kd, n._zappar_world_tracker_plane_anchor_orientation = $e.ld, n._zappar_world_tracker_plane_anchor_polygon_data = $e.md, n._zappar_world_tracker_plane_anchor_polygon_data_size = $e.nd, n._zappar_world_tracker_plane_anchor_polygon_version = $e.od, n._zappar_world_tracker_plane_anchor_status = $e.pd, n._worker_message_send_count = $e.qd, n._worker_message_send_clear = $e.rd, n._worker_message_send_data_size = $e.sd, n._worker_message_send_reference = $e.td, n._worker_message_send_instance = $e.ud, n._worker_message_send_data = $e.vd, n._worker_message_receive = $e.wd, n._ceres_worker = $e.xd, n._data_download_clear = $e.yd, n._data_download_size = $e.zd, n._data_download = $e.Ad, n._data_should_record_set = $e.Bd, n._zappar_analytics_project_id_set = $e.Cd, $e.htons, $e.ntohs;
		var er, rr = $e.Dd, tr = $e.Ed, ar = $e.Fd, nr = $e.Gd;
		function ir() {
			function e() {
				er || (er = !0, n.calledRun = !0, z || (M = !0, n.noFSInit || ce.init.initialized || ce.init(), ce.ignorePermissions = !1, ne.init(), q(L), t(n), n.onRuntimeInitialized && n.onRuntimeInitialized(), function() {
					if (n.postRun) for ("function" == typeof n.postRun && (n.postRun = [n.postRun]); n.postRun.length;) P(n.postRun.shift());
					q(F);
				}()));
			}
			I > 0 || (function() {
				if (n.preRun) for ("function" == typeof n.preRun && (n.preRun = [n.preRun]); n.preRun.length;) S(n.preRun.shift());
				q(R);
			}(), I > 0 || (n.setStatus ? (n.setStatus("Running..."), setTimeout(function() {
				setTimeout(function() {
					n.setStatus("");
				}, 1), e();
			}, 1)) : e()));
		}
		if (n.___start_em_js = 673284, n.___stop_em_js = 674449, n.cwrap = (e, r, t, a) => {
			var n = !t || t.every((e) => "number" === e || "boolean" === e);
			return "string" !== r && n && !a ? Ge(e) : function() {
				return He(e, r, t, arguments);
			};
		}, n.setValue = function(e, r, t = "i8") {
			switch (t.endsWith("*") && (t = "*"), t) {
				case "i1":
				case "i8":
					b[0 | e] = r;
					break;
				case "i16":
					g[e >> 1] = r;
					break;
				case "i32":
					v[e >> 2] = r;
					break;
				case "i64": N("to do setValue(i64) use WASM_BIGINT");
				case "float":
					E[e >> 2] = r;
					break;
				case "double":
					A[e >> 3] = r;
					break;
				case "*":
					k[e >> 2] = r;
					break;
				default: N(`invalid type for setValue: ${t}`);
			}
		}, n.getValue = function(e, r = "i8") {
			switch (r.endsWith("*") && (r = "*"), r) {
				case "i1":
				case "i8": return b[0 | e];
				case "i16": return g[e >> 1];
				case "i32": return v[e >> 2];
				case "i64": N("to do getValue(i64) use WASM_BIGINT");
				case "float": return E[e >> 2];
				case "double": return A[e >> 3];
				case "*": return k[e >> 2];
				default: N(`invalid type for getValue: ${r}`);
			}
		}, n.UTF8ToString = le, C = function e() {
			er || ir(), er || (C = e);
		}, n.preInit) for ("function" == typeof n.preInit && (n.preInit = [n.preInit]); n.preInit.length > 0;) n.preInit.pop()();
		return ir(), r;
	});
	var l, p, u, d, m, f, h, b, w, g, y, v, k = class {
		constructor(e) {
			this._messageSender = e, this._freeBufferPool = [], this._buffer = /* @__PURE__ */ new ArrayBuffer(16), this._i32View = new Int32Array(this._buffer), this._f32View = new Float32Array(this._buffer), this._f64View = new Float64Array(this._buffer), this._u8View = new Uint8Array(this._buffer), this._u8cView = new Uint8ClampedArray(this._buffer), this._u16View = new Uint16Array(this._buffer), this._u32View = new Uint32Array(this._buffer), this._offset = 1, this._startOffset = -1, this._timeoutSet = !1, this._appender = {
				int: (e) => this.int(e),
				bool: (e) => this.int(e ? 1 : 0),
				float: (e) => this.float(e),
				string: (e) => this.string(e),
				dataWithLength: (e) => this.arrayBuffer(e),
				type: (e) => this.int(e),
				matrix4x4: (e) => this.float32ArrayBuffer(e),
				matrix3x3: (e) => this.float32ArrayBuffer(e),
				floatArray: (e) => this.float32ArrayBuffer(e),
				ucharArray: (e) => this.uint8ArrayBuffer(e),
				identityCoefficients: (e) => this.float32ArrayBuffer(e),
				expressionCoefficients: (e) => this.float32ArrayBuffer(e),
				cameraModel: (e) => this.float32ArrayBuffer(e),
				timestamp: (e) => this.double(e),
				barcodeFormat: (e) => this.int(e),
				faceLandmarkName: (e) => this.int(e),
				instantTrackerTransformOrientation: (e) => this.int(e),
				transformOrientation: (e) => this.int(e),
				planeOrientation: (e) => this.int(e),
				anchorStatus: (e) => this.int(e),
				logLevel: (e) => this.int(e),
				worldScaleMode: (e) => this.int(e)
			}, this._freeBufferPool.push(/* @__PURE__ */ new ArrayBuffer(16)), this._freeBufferPool.push(/* @__PURE__ */ new ArrayBuffer(16));
		}
		bufferReturn(e) {
			this._freeBufferPool.push(e);
		}
		_ensureArrayBuffer(e) {
			let r, t = 4 * (this._offset + e + 8);
			if (this._buffer && this._buffer.byteLength >= t) return;
			if (!r) {
				let e = t;
				e--, e |= e >> 1, e |= e >> 2, e |= e >> 4, e |= e >> 8, e |= e >> 16, e++, r = new ArrayBuffer(e);
			}
			let a = this._buffer ? this._i32View : void 0;
			this._buffer = r, this._i32View = new Int32Array(this._buffer), this._f32View = new Float32Array(this._buffer), this._f64View = new Float64Array(this._buffer), this._u8View = new Uint8Array(this._buffer), this._u8cView = new Uint8ClampedArray(this._buffer), this._u16View = new Uint16Array(this._buffer), this._u32View = new Uint32Array(this._buffer), a && this._i32View.set(a.subarray(0, this._offset));
		}
		sendMessage(e, r) {
			this._ensureArrayBuffer(4), this._startOffset = this._offset, this._i32View[this._offset + 1] = e, this._offset += 2, r(this._appender), this._i32View[this._startOffset] = this._offset - this._startOffset, this._startOffset = -1, this._sendOneTime();
		}
		_sendOneTime() {
			!1 === this._timeoutSet && (this._timeoutSet = !0, setTimeout(() => {
				this._timeoutSet = !1, this._send();
			}, 0));
		}
		_send() {
			0 !== this._freeBufferPool.length ? (this._i32View[0] = this._offset, this._messageSender(this._buffer), this._buffer = void 0, this._buffer = this._freeBufferPool.pop(), this._i32View = new Int32Array(this._buffer), this._f32View = new Float32Array(this._buffer), this._f64View = new Float64Array(this._buffer), this._u8View = new Uint8Array(this._buffer), this._u8cView = new Uint8ClampedArray(this._buffer), this._u16View = new Uint16Array(this._buffer), this._u32View = new Uint32Array(this._buffer), this._offset = 1, this._startOffset = -1) : this._sendOneTime();
		}
		int(e) {
			this._ensureArrayBuffer(1), this._i32View[this._offset] = e, this._offset++;
		}
		double(e) {
			this._ensureArrayBuffer(2), this._offset % 2 == 1 && this._offset++, this._f64View[this._offset / 2] = e, this._offset += 2;
		}
		float(e) {
			this._ensureArrayBuffer(1), this._f32View[this._offset] = e, this._offset++;
		}
		int32Array(e) {
			this._ensureArrayBuffer(e.length);
			for (let r = 0; r < e.length; ++r) this._i32View[this._offset + r] = e[r];
			this._offset += e.length;
		}
		float32Array(e) {
			this._ensureArrayBuffer(e.length);
			for (let r = 0; r < e.length; ++r) this._f32View[this._offset + r] = e[r];
			this._offset += e.length;
		}
		booleanArray(e) {
			this._ensureArrayBuffer(e.length);
			for (let r = 0; r < e.length; ++r) this._i32View[this._offset + r] = e[r] ? 1 : 0;
			this._offset += e.length;
		}
		uint8ArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.byteLength, this._offset++, this._u8View.set(e, 4 * this._offset), this._offset += e.byteLength >> 2, 3 & e.byteLength && this._offset++;
		}
		arrayBuffer(e) {
			let r = new Uint8Array(e);
			this.uint8ArrayBuffer(r);
		}
		uint8ClampedArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.byteLength, this._offset++, this._u8cView.set(e, 4 * this._offset), this._offset += e.byteLength >> 2, 3 & e.byteLength && this._offset++;
		}
		float32ArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.length, this._offset++, this._f32View.set(e, this._offset), this._offset += e.length;
		}
		uint16ArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.length, this._offset++;
			let r = 2 * this._offset;
			this._u16View.set(e, r), this._offset += e.length >> 1, 1 & e.length && this._offset++;
		}
		int32ArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.length, this._offset++, this._i32View.set(e, this._offset), this._offset += e.length;
		}
		uint32ArrayBuffer(e) {
			this._ensureArrayBuffer(e.byteLength / 4), this._i32View[this._offset] = e.length, this._offset++, this._u32View.set(e, this._offset), this._offset += e.length;
		}
		string(e) {
			let r = new TextEncoder().encode(e);
			this._ensureArrayBuffer(r.byteLength / 4), this._i32View[this._offset] = r.byteLength, this._offset++, this._u8View.set(r, 4 * this._offset), this._offset += r.byteLength >> 2, 3 & r.byteLength && this._offset++;
		}
	}, E = class {
		constructor() {
			this._buffer = /* @__PURE__ */ new ArrayBuffer(0), this._i32View = new Int32Array(this._buffer), this._f32View = new Float32Array(this._buffer), this._f64View = new Float64Array(this._buffer), this._u8View = new Uint8Array(this._buffer), this._u16View = new Uint16Array(this._buffer), this._u32View = new Uint32Array(this._buffer), this._offset = 0, this._length = 0, this._startOffset = -1, this._processor = {
				int: () => this._i32View[this._startOffset++],
				bool: () => 1 === this._i32View[this._startOffset++],
				type: () => this._i32View[this._startOffset++],
				float: () => this._f32View[this._startOffset++],
				timestamp: () => {
					this._startOffset % 2 == 1 && this._startOffset++;
					let e = this._f64View[this._startOffset / 2];
					return this._startOffset += 2, e;
				},
				string: () => {
					let e = this._i32View[this._startOffset++], r = new TextDecoder().decode(new Uint8Array(this._buffer, 4 * this._startOffset, e));
					return this._startOffset += e >> 2, 3 & e && this._startOffset++, r;
				},
				dataWithLength: () => {
					let e = this._i32View[this._startOffset++], r = new Uint8Array(e);
					return r.set(this._u8View.subarray(4 * this._startOffset, 4 * this._startOffset + e)), this._startOffset += r.byteLength >> 2, 3 & r.byteLength && this._startOffset++, r.buffer;
				},
				ucharArray: () => {
					let e = this._i32View[this._startOffset++], r = new Uint8Array(e);
					return r.set(this._u8View.subarray(4 * this._startOffset, 4 * this._startOffset + e)), this._startOffset += r.byteLength >> 2, 3 & r.byteLength && this._startOffset++, r;
				},
				floatArray: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + e)), this._startOffset += e, r;
				},
				matrix4x4: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + 16)), this._startOffset += e, r;
				},
				matrix3x3: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + 9)), this._startOffset += e, r;
				},
				identityCoefficients: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + 50)), this._startOffset += e, r;
				},
				expressionCoefficients: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + 29)), this._startOffset += e, r;
				},
				cameraModel: () => {
					let e = this._i32View[this._startOffset++], r = new Float32Array(e);
					return r.set(this._f32View.subarray(this._startOffset, this._startOffset + 6)), this._startOffset += e, r;
				},
				barcodeFormat: () => this._i32View[this._startOffset++],
				worldScaleMode: () => this._i32View[this._startOffset++],
				faceLandmarkName: () => this._i32View[this._startOffset++],
				instantTrackerTransformOrientation: () => this._i32View[this._startOffset++],
				transformOrientation: () => this._i32View[this._startOffset++],
				planeOrientation: () => this._i32View[this._startOffset++],
				anchorStatus: () => this._i32View[this._startOffset++],
				logLevel: () => this._i32View[this._startOffset++]
			};
		}
		setData(e) {
			this._buffer = e, this._i32View = new Int32Array(this._buffer), this._f32View = new Float32Array(this._buffer), this._f64View = new Float64Array(this._buffer), this._u8View = new Uint8Array(this._buffer), this._u16View = new Uint16Array(this._buffer), this._u32View = new Uint32Array(this._buffer), this._offset = 0, this._length = 0, e.byteLength >= 4 && (this._offset = 1, this._length = this._i32View[0]), this._startOffset = -1;
		}
		hasMessage() {
			return this._offset + 1 < this._length;
		}
		forMessages(e) {
			for (; this.hasMessage();) {
				let r = this._i32View[this._offset], t = this._i32View[this._offset + 1];
				this._startOffset = this._offset + 2, this._offset += r, e(t, this._processor);
			}
		}
	}, A = class {
		constructor(e, r) {
			this._impl = e, this._sender = r, this._deserializer = new E(), this.serializersByPipelineId = /* @__PURE__ */ new Map(), this._pipeline_id_by_pipeline_id = /* @__PURE__ */ new Map(), this._pipeline_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_camera_source_id = /* @__PURE__ */ new Map(), this._camera_source_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_sequence_source_id = /* @__PURE__ */ new Map(), this._sequence_source_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_image_tracker_id = /* @__PURE__ */ new Map(), this._image_tracker_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_face_tracker_id = /* @__PURE__ */ new Map(), this._face_tracker_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_face_mesh_id = /* @__PURE__ */ new Map(), this._face_mesh_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_face_landmark_id = /* @__PURE__ */ new Map(), this._face_landmark_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_barcode_finder_id = /* @__PURE__ */ new Map(), this._barcode_finder_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_instant_world_tracker_id = /* @__PURE__ */ new Map(), this._instant_world_tracker_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_zapcode_tracker_id = /* @__PURE__ */ new Map(), this._zapcode_tracker_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_world_tracker_id = /* @__PURE__ */ new Map(), this._world_tracker_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_custom_anchor_id = /* @__PURE__ */ new Map(), this._custom_anchor_by_instance = /* @__PURE__ */ new Map(), this._pipeline_id_by_d3_tracker_id = /* @__PURE__ */ new Map(), this._d3_tracker_by_instance = /* @__PURE__ */ new Map();
		}
		processBuffer(e) {
			this._deserializer.setData(e), this._deserializer.forMessages((e, r) => {
				switch (e) {
					case 39:
						this._impl.log_level_set(r.logLevel());
						break;
					case 36:
						this._impl.analytics_project_id_set(r.string(), r.string());
						break;
					case 32: {
						let e = r.type(), t = this._impl.pipeline_create();
						this._pipeline_by_instance.set(e, t), this._pipeline_id_by_pipeline_id.set(e, e), this.serializersByPipelineId.set(e, new k((r) => {
							this._sender(e, r);
						}));
						break;
					}
					case 33: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_destroy(t), this._pipeline_by_instance.delete(e);
						break;
					}
					case 9: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_frame_update(t);
						break;
					}
					case 63: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_camera_frame_sharpness_enabled_set(t, r.bool());
						break;
					}
					case 8: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_camera_frame_submit(t, r.dataWithLength(), r.int(), r.int(), r.int(), r.matrix4x4(), r.cameraModel(), r.bool(), r.int());
						break;
					}
					case 10: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_accelerometer_submit(t, r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 12: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_accelerometer_with_gravity_submit_int(t, r.timestamp(), r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 11: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_accelerometer_without_gravity_submit_int(t, r.timestamp(), r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 15: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_rotation_rate_submit(t, r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 13: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_rotation_rate_submit_int(t, r.timestamp(), r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 16: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_attitude_submit(t, r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 14: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_attitude_submit_int(t, r.timestamp(), r.timestamp(), r.float(), r.float(), r.float());
						break;
					}
					case 17: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_relative_orientation_submit_int(t, r.timestamp(), r.timestamp(), r.float(), r.float(), r.float(), r.float());
						break;
					}
					case 18: {
						let e = r.type(), t = this._pipeline_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.pipeline_motion_attitude_matrix_submit(t, r.matrix4x4());
						break;
					}
					case 34: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = r.string(), i = this._impl.camera_source_create(a, n);
						this._camera_source_by_instance.set(e, i), this._pipeline_id_by_camera_source_id.set(e, t);
						break;
					}
					case 35: {
						let e = r.type(), t = this._camera_source_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.camera_source_destroy(t), this._camera_source_by_instance.delete(e);
						break;
					}
					case 40: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.sequence_source_create(a);
						this._sequence_source_by_instance.set(e, n), this._pipeline_id_by_sequence_source_id.set(e, t);
						break;
					}
					case 41: {
						let e = r.type(), t = this._sequence_source_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.sequence_source_destroy(t), this._sequence_source_by_instance.delete(e);
						break;
					}
					case 2: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.image_tracker_create(a);
						this._image_tracker_by_instance.set(e, n), this._pipeline_id_by_image_tracker_id.set(e, t);
						break;
					}
					case 19: {
						let e = r.type(), t = this._image_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.image_tracker_destroy(t), this._image_tracker_by_instance.delete(e);
						break;
					}
					case 4: {
						let e = r.type(), t = this._image_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.image_tracker_target_load_from_memory(t, r.dataWithLength());
						break;
					}
					case 3: {
						let e = r.type(), t = this._image_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.image_tracker_enabled_set(t, r.bool());
						break;
					}
					case 25: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.face_tracker_create(a);
						this._face_tracker_by_instance.set(e, n), this._pipeline_id_by_face_tracker_id.set(e, t);
						break;
					}
					case 26: {
						let e = r.type(), t = this._face_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_tracker_destroy(t), this._face_tracker_by_instance.delete(e);
						break;
					}
					case 27: {
						let e = r.type(), t = this._face_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_tracker_model_load_from_memory(t, r.dataWithLength());
						break;
					}
					case 28: {
						let e = r.type(), t = this._face_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_tracker_enabled_set(t, r.bool());
						break;
					}
					case 29: {
						let e = r.type(), t = this._face_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_tracker_max_faces_set(t, r.int());
						break;
					}
					case 30: {
						let e = r.type(), t = this._impl.face_mesh_create();
						this._face_mesh_by_instance.set(e, t);
						break;
					}
					case 31: {
						let e = r.type(), t = this._face_mesh_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_mesh_destroy(t), this._face_mesh_by_instance.delete(e);
						break;
					}
					case 37: {
						let e = r.type(), t = r.faceLandmarkName(), a = this._impl.face_landmark_create(t);
						this._face_landmark_by_instance.set(e, a);
						break;
					}
					case 38: {
						let e = r.type(), t = this._face_landmark_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.face_landmark_destroy(t), this._face_landmark_by_instance.delete(e);
						break;
					}
					case 21: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.barcode_finder_create(a);
						this._barcode_finder_by_instance.set(e, n), this._pipeline_id_by_barcode_finder_id.set(e, t);
						break;
					}
					case 22: {
						let e = r.type(), t = this._barcode_finder_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.barcode_finder_destroy(t), this._barcode_finder_by_instance.delete(e);
						break;
					}
					case 23: {
						let e = r.type(), t = this._barcode_finder_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.barcode_finder_enabled_set(t, r.bool());
						break;
					}
					case 24: {
						let e = r.type(), t = this._barcode_finder_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.barcode_finder_formats_set(t, r.barcodeFormat());
						break;
					}
					case 5: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.instant_world_tracker_create(a);
						this._instant_world_tracker_by_instance.set(e, n), this._pipeline_id_by_instant_world_tracker_id.set(e, t);
						break;
					}
					case 20: {
						let e = r.type(), t = this._instant_world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.instant_world_tracker_destroy(t), this._instant_world_tracker_by_instance.delete(e);
						break;
					}
					case 6: {
						let e = r.type(), t = this._instant_world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.instant_world_tracker_enabled_set(t, r.bool());
						break;
					}
					case 7: {
						let e = r.type(), t = this._instant_world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.instant_world_tracker_anchor_pose_set_from_camera_offset_raw(t, r.float(), r.float(), r.float(), r.instantTrackerTransformOrientation());
						break;
					}
					case 42: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.zapcode_tracker_create(a);
						this._zapcode_tracker_by_instance.set(e, n), this._pipeline_id_by_zapcode_tracker_id.set(e, t);
						break;
					}
					case 45: {
						let e = r.type(), t = this._zapcode_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.zapcode_tracker_destroy(t), this._zapcode_tracker_by_instance.delete(e);
						break;
					}
					case 44: {
						let e = r.type(), t = this._zapcode_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.zapcode_tracker_target_load_from_memory(t, r.dataWithLength());
						break;
					}
					case 43: {
						let e = r.type(), t = this._zapcode_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.zapcode_tracker_enabled_set(t, r.bool());
						break;
					}
					case 46: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.world_tracker_create(a);
						this._world_tracker_by_instance.set(e, n), this._pipeline_id_by_world_tracker_id.set(e, t);
						break;
					}
					case 47: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_destroy(t), this._world_tracker_by_instance.delete(e);
						break;
					}
					case 48: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_enabled_set(t, r.bool());
						break;
					}
					case 62: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_scale_mode_set(t, r.worldScaleMode());
						break;
					}
					case 49: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_horizontal_plane_detection_enabled_set(t, r.bool());
						break;
					}
					case 50: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_vertical_plane_detection_enabled_set(t, r.bool());
						break;
					}
					case 51: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_reset(t);
						break;
					}
					case 52: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_tracks_data_enabled_set(t, r.bool());
						break;
					}
					case 53: {
						let e = r.type(), t = this._world_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.world_tracker_projections_data_enabled_set(t, r.bool());
						break;
					}
					case 54: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = r.type(), i = this._world_tracker_by_instance.get(n), o = r.string(), s = this._impl.custom_anchor_create(a, i, o);
						this._custom_anchor_by_instance.set(e, s), this._pipeline_id_by_custom_anchor_id.set(e, t);
						break;
					}
					case 55: {
						let e = r.type(), t = this._custom_anchor_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.custom_anchor_destroy(t), this._custom_anchor_by_instance.delete(e);
						break;
					}
					case 56: {
						let e = r.type(), t = this._custom_anchor_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.custom_anchor_pose_set_from_camera_offset_raw(t, r.float(), r.float(), r.float(), r.transformOrientation());
						break;
					}
					case 57: {
						let e = r.type(), t = this._custom_anchor_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.custom_anchor_pose_set_from_anchor_offset(t, r.string(), r.float(), r.float(), r.float(), r.transformOrientation());
						break;
					}
					case 58: {
						let e = r.type(), t = this._custom_anchor_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.custom_anchor_pose_set(t, r.matrix4x4());
						break;
					}
					case 59: {
						let e = r.type(), t = this._custom_anchor_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.custom_anchor_pose_set_with_parent(t, r.matrix4x4(), r.string());
						break;
					}
					case 60: {
						let e = r.type(), t = r.type(), a = this._pipeline_by_instance.get(t), n = this._impl.d3_tracker_create(a);
						this._d3_tracker_by_instance.set(e, n), this._pipeline_id_by_d3_tracker_id.set(e, t);
						break;
					}
					case 61: {
						let e = r.type(), t = this._d3_tracker_by_instance.get(e);
						if (void 0 === t) return;
						this._impl.d3_tracker_destroy(t), this._d3_tracker_by_instance.delete(e);
						break;
					}
				}
			});
		}
		exploreState() {
			for (let [e, r] of this._pipeline_by_instance) {
				let t = this._pipeline_id_by_pipeline_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				a && (a.sendMessage(10, (t) => {
					t.type(e), t.int(this._impl.pipeline_frame_number(r));
				}), a.sendMessage(6, (t) => {
					t.type(e), t.cameraModel(this._impl.pipeline_camera_model(r));
				}), a.sendMessage(7, (t) => {
					t.type(e), t.int(this._impl.pipeline_camera_data_width(r));
				}), a.sendMessage(8, (t) => {
					t.type(e), t.int(this._impl.pipeline_camera_data_height(r));
				}), a.sendMessage(9, (t) => {
					t.type(e), t.float(this._impl.pipeline_camera_frame_sharpness(r));
				}), a.sendMessage(5, (t) => {
					t.type(e), t.int(this._impl.pipeline_camera_frame_user_data(r));
				}), a.sendMessage(14, (t) => {
					t.type(e), t.matrix4x4(this._impl.pipeline_camera_frame_camera_attitude(r));
				}), a.sendMessage(15, (t) => {
					t.type(e), t.matrix4x4(this._impl.pipeline_camera_frame_device_attitude(r));
				}));
			}
			for (let [e, r] of this._camera_source_by_instance) {
				let r = this._pipeline_id_by_camera_source_id.get(e);
				r && this.serializersByPipelineId.get(r);
			}
			for (let [e, r] of this._sequence_source_by_instance) {
				let r = this._pipeline_id_by_sequence_source_id.get(e);
				r && this.serializersByPipelineId.get(r);
			}
			for (let [e, r] of this._image_tracker_by_instance) {
				let t = this._pipeline_id_by_image_tracker_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				if (a) {
					a.sendMessage(22, (t) => {
						t.type(e), t.int(this._impl.image_tracker_target_loaded_version(r));
					}), a.sendMessage(1, (t) => {
						t.type(e), t.int(this._impl.image_tracker_anchor_count(r));
					});
					for (let t = 0; t < this._impl.image_tracker_anchor_count(r); t++) a.sendMessage(2, (a) => {
						a.type(e), a.int(t), a.string(this._impl.image_tracker_anchor_id(r, t));
					});
					for (let t = 0; t < this._impl.image_tracker_anchor_count(r); t++) a.sendMessage(3, (a) => {
						a.type(e), a.int(t), a.matrix4x4(this._impl.image_tracker_anchor_pose_raw(r, t));
					});
				}
			}
			for (let [e, r] of this._face_tracker_by_instance) {
				let t = this._pipeline_id_by_face_tracker_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				if (a) {
					a.sendMessage(21, (t) => {
						t.type(e), t.int(this._impl.face_tracker_model_loaded_version(r));
					}), a.sendMessage(16, (t) => {
						t.type(e), t.int(this._impl.face_tracker_anchor_count(r));
					});
					for (let t = 0; t < this._impl.face_tracker_anchor_count(r); t++) a.sendMessage(17, (a) => {
						a.type(e), a.int(t), a.string(this._impl.face_tracker_anchor_id(r, t));
					});
					for (let t = 0; t < this._impl.face_tracker_anchor_count(r); t++) a.sendMessage(18, (a) => {
						a.type(e), a.int(t), a.matrix4x4(this._impl.face_tracker_anchor_pose_raw(r, t));
					});
					for (let t = 0; t < this._impl.face_tracker_anchor_count(r); t++) a.sendMessage(19, (a) => {
						a.type(e), a.int(t), a.identityCoefficients(this._impl.face_tracker_anchor_identity_coefficients(r, t));
					});
					for (let t = 0; t < this._impl.face_tracker_anchor_count(r); t++) a.sendMessage(20, (a) => {
						a.type(e), a.int(t), a.expressionCoefficients(this._impl.face_tracker_anchor_expression_coefficients(r, t));
					});
				}
			}
			for (let [e, r] of this._face_mesh_by_instance) {
				let r = this._pipeline_id_by_face_mesh_id.get(e);
				r && this.serializersByPipelineId.get(r);
			}
			for (let [e, r] of this._face_landmark_by_instance) {
				let r = this._pipeline_id_by_face_landmark_id.get(e);
				r && this.serializersByPipelineId.get(r);
			}
			for (let [e, r] of this._barcode_finder_by_instance) {
				let t = this._pipeline_id_by_barcode_finder_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				if (a) {
					a.sendMessage(11, (t) => {
						t.type(e), t.int(this._impl.barcode_finder_found_number(r));
					});
					for (let t = 0; t < this._impl.barcode_finder_found_number(r); t++) a.sendMessage(12, (a) => {
						a.type(e), a.int(t), a.string(this._impl.barcode_finder_found_text(r, t));
					});
					for (let t = 0; t < this._impl.barcode_finder_found_number(r); t++) a.sendMessage(13, (a) => {
						a.type(e), a.int(t), a.barcodeFormat(this._impl.barcode_finder_found_format(r, t));
					});
				}
			}
			for (let [e, r] of this._instant_world_tracker_by_instance) {
				let t = this._pipeline_id_by_instant_world_tracker_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				a && a.sendMessage(4, (t) => {
					t.type(e), t.matrix4x4(this._impl.instant_world_tracker_anchor_pose_raw(r));
				});
			}
			for (let [e, r] of this._zapcode_tracker_by_instance) {
				let t = this._pipeline_id_by_zapcode_tracker_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				if (a) {
					a.sendMessage(27, (t) => {
						t.type(e), t.int(this._impl.zapcode_tracker_target_loaded_version(r));
					}), a.sendMessage(24, (t) => {
						t.type(e), t.int(this._impl.zapcode_tracker_anchor_count(r));
					});
					for (let t = 0; t < this._impl.zapcode_tracker_anchor_count(r); t++) a.sendMessage(25, (a) => {
						a.type(e), a.int(t), a.string(this._impl.zapcode_tracker_anchor_id(r, t));
					});
					for (let t = 0; t < this._impl.zapcode_tracker_anchor_count(r); t++) a.sendMessage(26, (a) => {
						a.type(e), a.int(t), a.matrix4x4(this._impl.zapcode_tracker_anchor_pose_raw(r, t));
					});
				}
			}
			for (let [e, r] of this._world_tracker_by_instance) {
				let t = this._pipeline_id_by_world_tracker_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				if (a) {
					a.sendMessage(28, (t) => {
						t.type(e), t.int(this._impl.world_tracker_session_number(r));
					}), a.sendMessage(44, (t) => {
						t.type(e), t.int(this._impl.world_tracker_quality(r));
					}), a.sendMessage(29, (t) => {
						t.type(e), t.int(this._impl.world_tracker_plane_anchor_count(r));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(37, (a) => {
						a.type(e), a.int(t), a.string(this._impl.world_tracker_plane_anchor_id(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(30, (a) => {
						a.type(e), a.int(t), a.matrix4x4(this._impl.world_tracker_plane_anchor_pose_raw(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(32, (a) => {
						a.type(e), a.int(t), a.anchorStatus(this._impl.world_tracker_plane_anchor_status(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(33, (a) => {
						a.type(e), a.int(t), a.int(this._impl.world_tracker_plane_anchor_polygon_data_size(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(34, (a) => {
						a.type(e), a.int(t), a.floatArray(this._impl.world_tracker_plane_anchor_polygon_data(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(35, (a) => {
						a.type(e), a.int(t), a.int(this._impl.world_tracker_plane_anchor_polygon_version(r, t));
					});
					for (let t = 0; t < this._impl.world_tracker_plane_anchor_count(r); t++) a.sendMessage(36, (a) => {
						a.type(e), a.int(t), a.planeOrientation(this._impl.world_tracker_plane_anchor_orientation(r, t));
					});
					a.sendMessage(40, (t) => {
						t.type(e), t.anchorStatus(this._impl.world_tracker_world_anchor_status(r));
					}), a.sendMessage(39, (t) => {
						t.type(e), t.string(this._impl.world_tracker_world_anchor_id(r));
					}), a.sendMessage(38, (t) => {
						t.type(e), t.matrix4x4(this._impl.world_tracker_world_anchor_pose_raw(r));
					}), a.sendMessage(42, (t) => {
						t.type(e), t.string(this._impl.world_tracker_ground_anchor_id(r));
					}), a.sendMessage(43, (t) => {
						t.type(e), t.anchorStatus(this._impl.world_tracker_ground_anchor_status(r));
					}), a.sendMessage(41, (t) => {
						t.type(e), t.matrix4x4(this._impl.world_tracker_ground_anchor_pose_raw(r));
					}), a.sendMessage(47, (t) => {
						t.type(e), t.int(this._impl.world_tracker_tracks_data_size(r));
					}), a.sendMessage(46, (t) => {
						t.type(e), t.floatArray(this._impl.world_tracker_tracks_data(r));
					}), a.sendMessage(49, (t) => {
						t.type(e), t.int(this._impl.world_tracker_tracks_type_data_size(r));
					}), a.sendMessage(48, (t) => {
						t.type(e), t.ucharArray(this._impl.world_tracker_tracks_type_data(r));
					}), a.sendMessage(52, (t) => {
						t.type(e), t.int(this._impl.world_tracker_projections_data_size(r));
					}), a.sendMessage(51, (t) => {
						t.type(e), t.floatArray(this._impl.world_tracker_projections_data(r));
					});
				}
			}
			for (let [e, r] of this._custom_anchor_by_instance) {
				let t = this._pipeline_id_by_custom_anchor_id.get(e);
				if (!t) continue;
				let a = this.serializersByPipelineId.get(t);
				a && (a.sendMessage(54, (t) => {
					t.type(e), t.anchorStatus(this._impl.custom_anchor_status(r));
				}), a.sendMessage(55, (t) => {
					t.type(e), t.int(this._impl.custom_anchor_pose_version(r));
				}), a.sendMessage(53, (t) => {
					t.type(e), t.matrix4x4(this._impl.custom_anchor_pose_raw(r));
				}));
			}
			for (let [e, r] of this._d3_tracker_by_instance) {
				let r = this._pipeline_id_by_d3_tracker_id.get(e);
				r && this.serializersByPipelineId.get(r);
			}
		}
	}, z = class {
		constructor() {
			this._funcs = [];
		}
		bind(e) {
			this._funcs.push(e);
		}
		unbind(e) {
			let r = this._funcs.indexOf(e);
			r > -1 && this._funcs.splice(r, 1);
		}
		emit() {
			for (var e = 0, r = this._funcs.length; e < r; e++) this._funcs[e]();
		}
	}, x = class {
		constructor() {
			this._funcs = [];
		}
		bind(e) {
			this._funcs.push(e);
		}
		unbind(e) {
			let r = this._funcs.indexOf(e);
			r > -1 && this._funcs.splice(r, 1);
		}
		emit(e) {
			for (var r = 0, t = this._funcs.length; r < t; r++) this._funcs[r](e);
		}
	}, T = "undefined" != typeof Float32Array ? Float32Array : Array;
	function R() {
		var e = new T(16);
		return T != Float32Array && (e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0), e[0] = 1, e[5] = 1, e[10] = 1, e[15] = 1, e;
	}
	function L(e) {
		return e[0] = 1, e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = 1, e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = 1, e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e;
	}
	function F(e, r) {
		return e[0] = r[0], e[1] = 0, e[2] = 0, e[3] = 0, e[4] = 0, e[5] = r[1], e[6] = 0, e[7] = 0, e[8] = 0, e[9] = 0, e[10] = r[2], e[11] = 0, e[12] = 0, e[13] = 0, e[14] = 0, e[15] = 1, e;
	}
	Math.hypot || (Math.hypot = function() {
		for (var e = 0, r = arguments.length; r--;) e += arguments[r] * arguments[r];
		return Math.sqrt(e);
	}), function(e) {
		e[e.UNKNOWN = 131072] = "UNKNOWN", e[e.AZTEC = 1] = "AZTEC", e[e.CODABAR = 2] = "CODABAR", e[e.CODE_39 = 4] = "CODE_39", e[e.CODE_93 = 8] = "CODE_93", e[e.CODE_128 = 16] = "CODE_128", e[e.DATA_MATRIX = 32] = "DATA_MATRIX", e[e.EAN_8 = 64] = "EAN_8", e[e.EAN_13 = 128] = "EAN_13", e[e.ITF = 256] = "ITF", e[e.MAXICODE = 512] = "MAXICODE", e[e.PDF_417 = 1024] = "PDF_417", e[e.QR_CODE = 2048] = "QR_CODE", e[e.RSS_14 = 4096] = "RSS_14", e[e.RSS_EXPANDED = 8192] = "RSS_EXPANDED", e[e.UPC_A = 16384] = "UPC_A", e[e.UPC_E = 32768] = "UPC_E", e[e.UPC_EAN_EXTENSION = 65536] = "UPC_EAN_EXTENSION", e[e.ALL = 131071] = "ALL";
	}(l || (l = {})), function(e) {
		e[e.EYE_LEFT = 0] = "EYE_LEFT", e[e.EYE_RIGHT = 1] = "EYE_RIGHT", e[e.EAR_LEFT = 2] = "EAR_LEFT", e[e.EAR_RIGHT = 3] = "EAR_RIGHT", e[e.NOSE_BRIDGE = 4] = "NOSE_BRIDGE", e[e.NOSE_TIP = 5] = "NOSE_TIP", e[e.NOSE_BASE = 6] = "NOSE_BASE", e[e.LIP_TOP = 7] = "LIP_TOP", e[e.LIP_BOTTOM = 8] = "LIP_BOTTOM", e[e.MOUTH_CENTER = 9] = "MOUTH_CENTER", e[e.CHIN = 10] = "CHIN", e[e.EYEBROW_LEFT = 11] = "EYEBROW_LEFT", e[e.EYEBROW_RIGHT = 12] = "EYEBROW_RIGHT";
	}(p || (p = {})), function(e) {
		e[e.WORLD = 3] = "WORLD", e[e.MINUS_Z_AWAY_FROM_USER = 4] = "MINUS_Z_AWAY_FROM_USER", e[e.MINUS_Z_HEADING = 5] = "MINUS_Z_HEADING", e[e.UNCHANGED = 6] = "UNCHANGED";
	}(u || (u = {})), function(e) {
		e[e.UNCHANGED = 0] = "UNCHANGED", e[e.WORLD = 1] = "WORLD", e[e.PARENT = 2] = "PARENT", e[e.Z_TOWARDS_CAMERA = 3] = "Z_TOWARDS_CAMERA";
	}(d || (d = {})), function(e) {
		e[e.LOG_LEVEL_NONE = 0] = "LOG_LEVEL_NONE", e[e.LOG_LEVEL_ERROR = 1] = "LOG_LEVEL_ERROR", e[e.LOG_LEVEL_WARNING = 2] = "LOG_LEVEL_WARNING", e[e.LOG_LEVEL_VERBOSE = 3] = "LOG_LEVEL_VERBOSE";
	}(m || (m = {})), function(e) {
		e[e.FRAME_PIXEL_FORMAT_I420 = 0] = "FRAME_PIXEL_FORMAT_I420", e[e.FRAME_PIXEL_FORMAT_I420A = 1] = "FRAME_PIXEL_FORMAT_I420A", e[e.FRAME_PIXEL_FORMAT_I422 = 2] = "FRAME_PIXEL_FORMAT_I422", e[e.FRAME_PIXEL_FORMAT_I444 = 3] = "FRAME_PIXEL_FORMAT_I444", e[e.FRAME_PIXEL_FORMAT_NV12 = 4] = "FRAME_PIXEL_FORMAT_NV12", e[e.FRAME_PIXEL_FORMAT_RGBA = 5] = "FRAME_PIXEL_FORMAT_RGBA", e[e.FRAME_PIXEL_FORMAT_BGRA = 6] = "FRAME_PIXEL_FORMAT_BGRA", e[e.FRAME_PIXEL_FORMAT_Y = 7] = "FRAME_PIXEL_FORMAT_Y";
	}(f || (f = {})), function(e) {
		e[e.IMAGE_TRACKER_TYPE_PLANAR = 0] = "IMAGE_TRACKER_TYPE_PLANAR", e[e.IMAGE_TRACKER_TYPE_CYLINDRICAL = 1] = "IMAGE_TRACKER_TYPE_CYLINDRICAL", e[e.IMAGE_TRACKER_TYPE_CONICAL = 2] = "IMAGE_TRACKER_TYPE_CONICAL";
	}(h || (h = {})), function(e) {
		e[e.WORLD_TRACKER_QUALITY_INITIALIZING = 0] = "WORLD_TRACKER_QUALITY_INITIALIZING", e[e.WORLD_TRACKER_QUALITY_GOOD = 1] = "WORLD_TRACKER_QUALITY_GOOD", e[e.WORLD_TRACKER_QUALITY_LIMITED = 2] = "WORLD_TRACKER_QUALITY_LIMITED", e[e.WORLD_TRACKER_QUALITY_INACTIVE = 3] = "WORLD_TRACKER_QUALITY_INACTIVE";
	}(b || (b = {})), function(e) {
		e[e.ANCHOR_STATUS_INITIALIZING = 0] = "ANCHOR_STATUS_INITIALIZING", e[e.ANCHOR_STATUS_TRACKING = 1] = "ANCHOR_STATUS_TRACKING", e[e.ANCHOR_STATUS_PAUSED = 2] = "ANCHOR_STATUS_PAUSED", e[e.ANCHOR_STATUS_STOPPED = 3] = "ANCHOR_STATUS_STOPPED";
	}(w || (w = {})), function(e) {
		e[e.PLANE_ORIENTATION_HORIZONTAL = 0] = "PLANE_ORIENTATION_HORIZONTAL", e[e.PLANE_ORIENTATION_VERTICAL = 1] = "PLANE_ORIENTATION_VERTICAL";
	}(g || (g = {})), function(e) {
		e[e.DEFAULT = 0] = "DEFAULT", e[e.HIGH = 1] = "HIGH";
	}(y || (y = {})), function(e) {
		e[e.DEFAULT = 0] = "DEFAULT", e[e.ABSOLUTE = 1] = "ABSOLUTE", e[e.MEDIAN = 2] = "MEDIAN";
	}(v || (v = {}));
	const M = /* @__PURE__ */ new Map();
	var S, P = class e {
		constructor(e) {
			this._gl = e, this._viewports = [], this._underlyingViewport = this._gl.viewport, this._viewports.push(this._gl.getParameter(this._gl.VIEWPORT)), this._gl.viewport = (e, r, t, a) => {
				this._viewports[this._viewports.length - 1] = [
					e,
					r,
					t,
					a
				], this._underlyingViewport.call(this._gl, e, r, t, a);
			};
		}
		static get(r) {
			let t = M.get(r);
			return t || (t = new e(r), M.set(r, t)), t;
		}
		push() {
			this._viewports.push(this._viewports[this._viewports.length - 1]);
		}
		pop() {
			const e = this._viewports.pop(), r = this._viewports[this._viewports.length - 1];
			e && e[0] === r[0] && e[1] === r[1] && e[2] === r[2] && e[3] === r[3] || this._underlyingViewport.call(this._gl, r[0], r[1], r[2], r[3]);
		}
	}, I = _(s((e, r) => {
		(function(t, a) {
			"use strict";
			var n = "function", i = "undefined", o = "object", s = "string", _ = "model", c = "name", l = "type", p = "vendor", u = "version", d = "architecture", m = "console", f = "mobile", h = "tablet", b = "smarttv", w = "wearable", g = "embedded", y = "Amazon", v = "Apple", k = "ASUS", E = "BlackBerry", A = "Browser", z = "Chrome", x = "Firefox", T = "Google", R = "Huawei", L = "LG", F = "Microsoft", M = "Motorola", S = "Opera", P = "Samsung", I = "Sharp", O = "Sony", C = "Xiaomi", D = "Zebra", B = "Facebook", N = function(e) {
				for (var r = {}, t = 0; t < e.length; t++) r[e[t].toUpperCase()] = e[t];
				return r;
			}, U = function(e, r) {
				return typeof e === s && -1 !== V(r).indexOf(V(e));
			}, V = function(e) {
				return e.toLowerCase();
			}, G = function(e, r) {
				if (typeof e === s) return e = e.replace(/^\s\s*/, ""), typeof r === i ? e : e.substring(0, 350);
			}, H = function(e, r) {
				for (var t, i, s, _, c, l, p = 0; p < r.length && !c;) {
					var u = r[p], d = r[p + 1];
					for (t = i = 0; t < u.length && !c;) if (c = u[t++].exec(e)) for (s = 0; s < d.length; s++) l = c[++i], typeof (_ = d[s]) === o && _.length > 0 ? 2 === _.length ? typeof _[1] == n ? this[_[0]] = _[1].call(this, l) : this[_[0]] = _[1] : 3 === _.length ? typeof _[1] !== n || _[1].exec && _[1].test ? this[_[0]] = l ? l.replace(_[1], _[2]) : a : this[_[0]] = l ? _[1].call(this, l, _[2]) : a : 4 === _.length && (this[_[0]] = l ? _[3].call(this, l.replace(_[1], _[2])) : a) : this[_] = l || a;
					p += 2;
				}
			}, X = function(e, r) {
				for (var t in r) if (typeof r[t] === o && r[t].length > 0) {
					for (var n = 0; n < r[t].length; n++) if (U(r[t][n], e)) return "?" === t ? a : t;
				} else if (U(r[t], e)) return "?" === t ? a : t;
				return e;
			}, W = {
				ME: "4.90",
				"NT 3.11": "NT3.51",
				"NT 4.0": "NT4.0",
				2e3: "NT 5.0",
				XP: ["NT 5.1", "NT 5.2"],
				Vista: "NT 6.0",
				7: "NT 6.1",
				8: "NT 6.2",
				8.1: "NT 6.3",
				10: ["NT 6.4", "NT 10.0"],
				RT: "ARM"
			}, q = {
				browser: [
					[/\b(?:crmo|crios)\/([\w\.]+)/i],
					[u, [c, "Chrome"]],
					[/edg(?:e|ios|a)?\/([\w\.]+)/i],
					[u, [c, "Edge"]],
					[
						/(opera mini)\/([-\w\.]+)/i,
						/(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,
						/(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i
					],
					[c, u],
					[/opios[\/ ]+([\w\.]+)/i],
					[u, [c, S + " Mini"]],
					[/\bopr\/([\w\.]+)/i],
					[u, [c, S]],
					[
						/(kindle)\/([\w\.]+)/i,
						/(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,
						/(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,
						/(ba?idubrowser)[\/ ]?([\w\.]+)/i,
						/(?:ms|\()(ie) ([\w\.]+)/i,
						/(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i,
						/(weibo)__([\d\.]+)/i
					],
					[c, u],
					[/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i],
					[u, [c, "UC" + A]],
					[/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i],
					[u, [c, "WeChat(Win) Desktop"]],
					[/micromessenger\/([\w\.]+)/i],
					[u, [c, "WeChat"]],
					[/konqueror\/([\w\.]+)/i],
					[u, [c, "Konqueror"]],
					[/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i],
					[u, [c, "IE"]],
					[/yabrowser\/([\w\.]+)/i],
					[u, [c, "Yandex"]],
					[/(avast|avg)\/([\w\.]+)/i],
					[[
						c,
						/(.+)/,
						"$1 Secure " + A
					], u],
					[/\bfocus\/([\w\.]+)/i],
					[u, [c, x + " Focus"]],
					[/\bopt\/([\w\.]+)/i],
					[u, [c, S + " Touch"]],
					[/coc_coc\w+\/([\w\.]+)/i],
					[u, [c, "Coc Coc"]],
					[/dolfin\/([\w\.]+)/i],
					[u, [c, "Dolphin"]],
					[/coast\/([\w\.]+)/i],
					[u, [c, S + " Coast"]],
					[/miuibrowser\/([\w\.]+)/i],
					[u, [c, "MIUI " + A]],
					[/fxios\/([-\w\.]+)/i],
					[u, [c, x]],
					[/\bqihu|(qi?ho?o?|360)browser/i],
					[[c, "360 " + A]],
					[/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i],
					[[
						c,
						/(.+)/,
						"$1 " + A
					], u],
					[/(comodo_dragon)\/([\w\.]+)/i],
					[[
						c,
						/_/g,
						" "
					], u],
					[
						/(electron)\/([\w\.]+) safari/i,
						/(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,
						/m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i
					],
					[c, u],
					[
						/(metasr)[\/ ]?([\w\.]+)/i,
						/(lbbrowser)/i,
						/\[(linkedin)app\]/i
					],
					[c],
					[/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i],
					[[c, B], u],
					[
						/safari (line)\/([\w\.]+)/i,
						/\b(line)\/([\w\.]+)\/iab/i,
						/(chromium|instagram)[\/ ]([-\w\.]+)/i
					],
					[c, u],
					[/\bgsa\/([\w\.]+) .*safari\//i],
					[u, [c, "GSA"]],
					[/headlesschrome(?:\/([\w\.]+)| )/i],
					[u, [c, z + " Headless"]],
					[/ wv\).+(chrome)\/([\w\.]+)/i],
					[[c, z + " WebView"], u],
					[/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i],
					[u, [c, "Android " + A]],
					[/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i],
					[c, u],
					[/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i],
					[u, [c, "Mobile Safari"]],
					[/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i],
					[u, c],
					[/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i],
					[c, [
						u,
						X,
						{
							"1.0": "/8",
							1.2: "/1",
							1.3: "/3",
							"2.0": "/412",
							"2.0.2": "/416",
							"2.0.3": "/417",
							"2.0.4": "/419",
							"?": "/"
						}
					]],
					[/(webkit|khtml)\/([\w\.]+)/i],
					[c, u],
					[/(navigator|netscape\d?)\/([-\w\.]+)/i],
					[[c, "Netscape"], u],
					[/mobile vr; rv:([\w\.]+)\).+firefox/i],
					[u, [c, x + " Reality"]],
					[
						/ekiohf.+(flow)\/([\w\.]+)/i,
						/(swiftfox)/i,
						/(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
						/(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
						/(firefox)\/([\w\.]+)/i,
						/(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,
						/(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
						/(links) \(([\w\.]+)/i
					],
					[c, u],
					[/(cobalt)\/([\w\.]+)/i],
					[c, [
						u,
						/master.|lts./,
						""
					]]
				],
				cpu: [
					[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i],
					[[d, "amd64"]],
					[/(ia32(?=;))/i],
					[[d, V]],
					[/((?:i[346]|x)86)[;\)]/i],
					[[d, "ia32"]],
					[/\b(aarch64|arm(v?8e?l?|_?64))\b/i],
					[[d, "arm64"]],
					[/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i],
					[[d, "armhf"]],
					[/windows (ce|mobile); ppc;/i],
					[[d, "arm"]],
					[/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i],
					[[
						d,
						/ower/,
						"",
						V
					]],
					[/(sun4\w)[;\)]/i],
					[[d, "sparc"]],
					[/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i],
					[[d, V]]
				],
				device: [
					[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i],
					[
						_,
						[p, P],
						[l, h]
					],
					[
						/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i,
						/samsung[- ]([-\w]+)/i,
						/sec-(sgh\w+)/i
					],
					[
						_,
						[p, P],
						[l, f]
					],
					[/\((ip(?:hone|od)[\w ]*);/i],
					[
						_,
						[p, v],
						[l, f]
					],
					[
						/\((ipad);[-\w\),; ]+apple/i,
						/applecoremedia\/[\w\.]+ \((ipad)/i,
						/\b(ipad)\d\d?,\d\d?[;\]].+ios/i
					],
					[
						_,
						[p, v],
						[l, h]
					],
					[/(macintosh);/i],
					[_, [p, v]],
					[/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i],
					[
						_,
						[p, R],
						[l, h]
					],
					[/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i],
					[
						_,
						[p, R],
						[l, f]
					],
					[
						/\b(poco[\w ]+)(?: bui|\))/i,
						/\b; (\w+) build\/hm\1/i,
						/\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,
						/\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,
						/\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i
					],
					[
						[
							_,
							/_/g,
							" "
						],
						[p, C],
						[l, f]
					],
					[/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i],
					[
						[
							_,
							/_/g,
							" "
						],
						[p, C],
						[l, h]
					],
					[/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i],
					[
						_,
						[p, "OPPO"],
						[l, f]
					],
					[/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i],
					[
						_,
						[p, "Vivo"],
						[l, f]
					],
					[/\b(rmx[12]\d{3})(?: bui|;|\))/i],
					[
						_,
						[p, "Realme"],
						[l, f]
					],
					[
						/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
						/\bmot(?:orola)?[- ](\w*)/i,
						/((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
					],
					[
						_,
						[p, M],
						[l, f]
					],
					[/\b(mz60\d|xoom[2 ]{0,2}) build\//i],
					[
						_,
						[p, M],
						[l, h]
					],
					[/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i],
					[
						_,
						[p, L],
						[l, h]
					],
					[
						/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
						/\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
						/\blg-?([\d\w]+) bui/i
					],
					[
						_,
						[p, L],
						[l, f]
					],
					[/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i],
					[
						_,
						[p, "Lenovo"],
						[l, h]
					],
					[/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i],
					[
						[
							_,
							/_/g,
							" "
						],
						[p, "Nokia"],
						[l, f]
					],
					[/(pixel c)\b/i],
					[
						_,
						[p, T],
						[l, h]
					],
					[/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i],
					[
						_,
						[p, T],
						[l, f]
					],
					[/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i],
					[
						_,
						[p, O],
						[l, f]
					],
					[/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i],
					[
						[_, "Xperia Tablet"],
						[p, O],
						[l, h]
					],
					[/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i],
					[
						_,
						[p, "OnePlus"],
						[l, f]
					],
					[
						/(alexa)webm/i,
						/(kf[a-z]{2}wi)( bui|\))/i,
						/(kf[a-z]+)( bui|\)).+silk\//i
					],
					[
						_,
						[p, y],
						[l, h]
					],
					[/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i],
					[
						[
							_,
							/(.+)/g,
							"Fire Phone $1"
						],
						[p, y],
						[l, f]
					],
					[/(playbook);[-\w\),; ]+(rim)/i],
					[
						_,
						p,
						[l, h]
					],
					[/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i],
					[
						_,
						[p, E],
						[l, f]
					],
					[/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i],
					[
						_,
						[p, k],
						[l, h]
					],
					[/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i],
					[
						_,
						[p, k],
						[l, f]
					],
					[/(nexus 9)/i],
					[
						_,
						[p, "HTC"],
						[l, h]
					],
					[
						/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,
						/(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
						/(alcatel|geeksphone|nexian|panasonic|sony(?!-bra))[-_ ]?([-\w]*)/i
					],
					[
						p,
						[
							_,
							/_/g,
							" "
						],
						[l, f]
					],
					[/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i],
					[
						_,
						[p, "Acer"],
						[l, h]
					],
					[/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i],
					[
						_,
						[p, "Meizu"],
						[l, f]
					],
					[/\b(sh-?[altvz]?\d\d[a-ekm]?)/i],
					[
						_,
						[p, I],
						[l, f]
					],
					[
						/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
						/(hp) ([\w ]+\w)/i,
						/(asus)-?(\w+)/i,
						/(microsoft); (lumia[\w ]+)/i,
						/(lenovo)[-_ ]?([-\w]+)/i,
						/(jolla)/i,
						/(oppo) ?([\w ]+) bui/i
					],
					[
						p,
						_,
						[l, f]
					],
					[
						/(archos) (gamepad2?)/i,
						/(hp).+(touchpad(?!.+tablet)|tablet)/i,
						/(kindle)\/([\w\.]+)/i,
						/(nook)[\w ]+build\/(\w+)/i,
						/(dell) (strea[kpr\d ]*[\dko])/i,
						/(le[- ]+pan)[- ]+(\w{1,9}) bui/i,
						/(trinity)[- ]*(t\d{3}) bui/i,
						/(gigaset)[- ]+(q\w{1,9}) bui/i,
						/(vodafone) ([\w ]+)(?:\)| bui)/i
					],
					[
						p,
						_,
						[l, h]
					],
					[/(surface duo)/i],
					[
						_,
						[p, F],
						[l, h]
					],
					[/droid [\d\.]+; (fp\du?)(?: b|\))/i],
					[
						_,
						[p, "Fairphone"],
						[l, f]
					],
					[/(u304aa)/i],
					[
						_,
						[p, "AT&T"],
						[l, f]
					],
					[/\bsie-(\w*)/i],
					[
						_,
						[p, "Siemens"],
						[l, f]
					],
					[/\b(rct\w+) b/i],
					[
						_,
						[p, "RCA"],
						[l, h]
					],
					[/\b(venue[\d ]{2,7}) b/i],
					[
						_,
						[p, "Dell"],
						[l, h]
					],
					[/\b(q(?:mv|ta)\w+) b/i],
					[
						_,
						[p, "Verizon"],
						[l, h]
					],
					[/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i],
					[
						_,
						[p, "Barnes & Noble"],
						[l, h]
					],
					[/\b(tm\d{3}\w+) b/i],
					[
						_,
						[p, "NuVision"],
						[l, h]
					],
					[/\b(k88) b/i],
					[
						_,
						[p, "ZTE"],
						[l, h]
					],
					[/\b(nx\d{3}j) b/i],
					[
						_,
						[p, "ZTE"],
						[l, f]
					],
					[/\b(gen\d{3}) b.+49h/i],
					[
						_,
						[p, "Swiss"],
						[l, f]
					],
					[/\b(zur\d{3}) b/i],
					[
						_,
						[p, "Swiss"],
						[l, h]
					],
					[/\b((zeki)?tb.*\b) b/i],
					[
						_,
						[p, "Zeki"],
						[l, h]
					],
					[/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i],
					[
						[p, "Dragon Touch"],
						_,
						[l, h]
					],
					[/\b(ns-?\w{0,9}) b/i],
					[
						_,
						[p, "Insignia"],
						[l, h]
					],
					[/\b((nxa|next)-?\w{0,9}) b/i],
					[
						_,
						[p, "NextBook"],
						[l, h]
					],
					[/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i],
					[
						[p, "Voice"],
						_,
						[l, f]
					],
					[/\b(lvtel\-)?(v1[12]) b/i],
					[
						[p, "LvTel"],
						_,
						[l, f]
					],
					[/\b(ph-1) /i],
					[
						_,
						[p, "Essential"],
						[l, f]
					],
					[/\b(v(100md|700na|7011|917g).*\b) b/i],
					[
						_,
						[p, "Envizen"],
						[l, h]
					],
					[/\b(trio[-\w\. ]+) b/i],
					[
						_,
						[p, "MachSpeed"],
						[l, h]
					],
					[/\btu_(1491) b/i],
					[
						_,
						[p, "Rotor"],
						[l, h]
					],
					[/(shield[\w ]+) b/i],
					[
						_,
						[p, "Nvidia"],
						[l, h]
					],
					[/(sprint) (\w+)/i],
					[
						p,
						_,
						[l, f]
					],
					[/(kin\.[onetw]{3})/i],
					[
						[
							_,
							/\./g,
							" "
						],
						[p, F],
						[l, f]
					],
					[/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i],
					[
						_,
						[p, D],
						[l, h]
					],
					[/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i],
					[
						_,
						[p, D],
						[l, f]
					],
					[/(ouya)/i, /(nintendo) ([wids3utch]+)/i],
					[
						p,
						_,
						[l, m]
					],
					[/droid.+; (shield) bui/i],
					[
						_,
						[p, "Nvidia"],
						[l, m]
					],
					[/(playstation [345portablevi]+)/i],
					[
						_,
						[p, O],
						[l, m]
					],
					[/\b(xbox(?: one)?(?!; xbox))[\); ]/i],
					[
						_,
						[p, F],
						[l, m]
					],
					[/smart-tv.+(samsung)/i],
					[p, [l, b]],
					[/hbbtv.+maple;(\d+)/i],
					[
						[
							_,
							/^/,
							"SmartTV"
						],
						[p, P],
						[l, b]
					],
					[/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i],
					[[p, L], [l, b]],
					[/(apple) ?tv/i],
					[
						p,
						[_, v + " TV"],
						[l, b]
					],
					[/crkey/i],
					[
						[_, z + "cast"],
						[p, T],
						[l, b]
					],
					[/droid.+aft(\w)( bui|\))/i],
					[
						_,
						[p, y],
						[l, b]
					],
					[/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i],
					[
						_,
						[p, I],
						[l, b]
					],
					[/(bravia[\w ]+)( bui|\))/i],
					[
						_,
						[p, O],
						[l, b]
					],
					[/(mitv-\w{5}) bui/i],
					[
						_,
						[p, C],
						[l, b]
					],
					[/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i],
					[
						[p, G],
						[_, G],
						[l, b]
					],
					[/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i],
					[[l, b]],
					[/((pebble))app/i],
					[
						p,
						_,
						[l, w]
					],
					[/droid.+; (glass) \d/i],
					[
						_,
						[p, T],
						[l, w]
					],
					[/droid.+; (wt63?0{2,3})\)/i],
					[
						_,
						[p, D],
						[l, w]
					],
					[/(quest( 2)?)/i],
					[
						_,
						[p, B],
						[l, w]
					],
					[/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i],
					[p, [l, g]],
					[/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i],
					[_, [l, f]],
					[/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i],
					[_, [l, h]],
					[/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i],
					[[l, h]],
					[/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i],
					[[l, f]],
					[/(android[-\w\. ]{0,9});.+buil/i],
					[_, [p, "Generic"]]
				],
				engine: [
					[/windows.+ edge\/([\w\.]+)/i],
					[u, [c, "EdgeHTML"]],
					[/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i],
					[u, [c, "Blink"]],
					[
						/(presto)\/([\w\.]+)/i,
						/(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i,
						/ekioh(flow)\/([\w\.]+)/i,
						/(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,
						/(icab)[\/ ]([23]\.[\d\.]+)/i
					],
					[c, u],
					[/rv\:([\w\.]{1,9})\b.+(gecko)/i],
					[u, c]
				],
				os: [
					[/microsoft (windows) (vista|xp)/i],
					[c, u],
					[
						/(windows) nt 6\.2; (arm)/i,
						/(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,
						/(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i
					],
					[c, [
						u,
						X,
						W
					]],
					[/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i],
					[[c, "Windows"], [
						u,
						X,
						W
					]],
					[/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /cfnetwork\/.+darwin/i],
					[[
						u,
						/_/g,
						"."
					], [c, "iOS"]],
					[/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i],
					[[c, "Mac OS"], [
						u,
						/_/g,
						"."
					]],
					[/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i],
					[u, c],
					[
						/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
						/(blackberry)\w*\/([\w\.]*)/i,
						/(tizen|kaios)[\/ ]([\w\.]+)/i,
						/\((series40);/i
					],
					[c, u],
					[/\(bb(10);/i],
					[u, [c, E]],
					[/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i],
					[u, [c, "Symbian"]],
					[/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i],
					[u, [c, x + " OS"]],
					[/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i],
					[u, [c, "webOS"]],
					[/crkey\/([\d\.]+)/i],
					[u, [c, z + "cast"]],
					[/(cros) [\w]+ ([\w\.]+\w)/i],
					[[c, "Chromium OS"], u],
					[
						/(nintendo|playstation) ([wids345portablevuch]+)/i,
						/(xbox); +xbox ([^\);]+)/i,
						/\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,
						/(mint)[\/\(\) ]?(\w*)/i,
						/(mageia|vectorlinux)[; ]/i,
						/([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
						/(hurd|linux) ?([\w\.]*)/i,
						/(gnu) ?([\w\.]*)/i,
						/\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i,
						/(haiku) (\w+)/i
					],
					[c, u],
					[/(sunos) ?([\w\.\d]*)/i],
					[[c, "Solaris"], u],
					[
						/((?:open)?solaris)[-\/ ]?([\w\.]*)/i,
						/(aix) ((\d)(?=\.|\)| )[\w\.])*/i,
						/\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,
						/(unix) ?([\w\.]*)/i
					],
					[c, u]
				]
			}, Y = function(e, r) {
				if (typeof e === o && (r = e, e = a), !(this instanceof Y)) return new Y(e, r).getResult();
				var n = e || (typeof t !== i && t.navigator && t.navigator.userAgent ? t.navigator.userAgent : ""), m = r ? function(e, r) {
					var t = {};
					for (var a in e) r[a] && r[a].length % 2 == 0 ? t[a] = r[a].concat(e[a]) : t[a] = e[a];
					return t;
				}(q, r) : q;
				return this.getBrowser = function() {
					var e, r = {};
					return r[c] = a, r[u] = a, H.call(r, n, m.browser), r.major = typeof (e = r.version) === s ? e.replace(/[^\d\.]/g, "").split(".")[0] : a, r;
				}, this.getCPU = function() {
					var e = {};
					return e[d] = a, H.call(e, n, m.cpu), e;
				}, this.getDevice = function() {
					var e = {};
					return e[p] = a, e[_] = a, e[l] = a, H.call(e, n, m.device), e;
				}, this.getEngine = function() {
					var e = {};
					return e[c] = a, e[u] = a, H.call(e, n, m.engine), e;
				}, this.getOS = function() {
					var e = {};
					return e[c] = a, e[u] = a, H.call(e, n, m.os), e;
				}, this.getResult = function() {
					return {
						ua: this.getUA(),
						browser: this.getBrowser(),
						engine: this.getEngine(),
						os: this.getOS(),
						device: this.getDevice(),
						cpu: this.getCPU()
					};
				}, this.getUA = function() {
					return n;
				}, this.setUA = function(e) {
					return n = typeof e === s && e.length > 350 ? G(e, 350) : e, this;
				}, this.setUA(n), this;
			};
			Y.VERSION = "1.0.33", Y.BROWSER = N([
				c,
				u,
				"major"
			]), Y.CPU = N([d]), Y.DEVICE = N([
				_,
				p,
				l,
				m,
				f,
				b,
				h,
				w,
				g
			]), Y.ENGINE = Y.OS = N([c, u]), typeof e !== i ? (typeof r !== i && r.exports && (e = r.exports = Y), e.UAParser = Y) : typeof define === n && define.amd ? define(function() {
				return Y;
			}) : typeof t !== i && (t.UAParser = Y);
			var j = typeof t !== i && (t.jQuery || t.Zepto);
			if (j && !j.ua) {
				var Z = new Y();
				j.ua = Z.getResult(), j.ua.get = function() {
					return Z.getUA();
				}, j.ua.set = function(e) {
					Z.setUA(e);
					var r = Z.getResult();
					for (var t in r) j.ua[t] = r[t];
				};
			}
		})("object" == typeof window ? window : e);
	})());
	(function(e) {
		e[e.OBJECT_URL = 0] = "OBJECT_URL", e[e.SRC_OBJECT = 1] = "SRC_OBJECT";
	})(S || (S = {}));
	let O = {
		deviceMotionMutliplier: -1,
		blacklisted: !1,
		showGyroPermissionsWarningIfNecessary: !1,
		showSafariPermissionsResetIfNecessary: !1,
		requestHighFrameRate: !1,
		videoWidth: 1280,
		videoHeight: 720,
		getDataSize: (e) => e === y.HIGH ? [640, 360] : [320, 180],
		videoElementInDOM: !1,
		preferMediaStreamTrackProcessorCamera: !1,
		preferImageBitmapCamera: !1,
		ios164CameraSelection: !1,
		relyOnConstraintsForCameraSelection: !1,
		forceWindowOrientation: !1,
		intervalMultiplier: 1,
		trustSensorIntervals: !1,
		offscreenCanvasSupported: void 0 !== globalThis.OffscreenCanvas
	};
	"undefined" != typeof window && (window.zeeProfile = O, window.location.href.indexOf("_mstppipeline") >= 0 && (console.log("Configuring for MSTP camera pipeline (if supported)"), O.preferMediaStreamTrackProcessorCamera = !0), window.location.href.indexOf("_imagebitmappipeline") >= 0 && (console.log("Configuring for ImageBitmap camera pipeline (if supported)"), O.preferImageBitmapCamera = !0));
	let C = new I.UAParser(), D = (C.getOS().name || "unknown").toLowerCase(), B = (C.getEngine().name || "unknown").toLowerCase();
	function N(e) {
		O.forceWindowOrientation = !0, O.preferMediaStreamTrackProcessorCamera = !1, O.intervalMultiplier = 1e3, O.trustSensorIntervals = !0;
		let r = e.split(".");
		if (r.length >= 2) {
			const e = parseInt(r[0]), t = parseInt(r[1]);
			(e < 11 || 11 === e && t < 3) && (O.blacklisted = !0), (e < 12 || 12 === e && t < 2) && (O.videoElementInDOM = !0), (12 === e && t >= 2 || e >= 13) && (O.showGyroPermissionsWarningIfNecessary = !0), e >= 13 && (O.showSafariPermissionsResetIfNecessary = !0), (e >= 12 && t > 1 || e >= 13) && navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints && navigator.mediaDevices.getSupportedConstraints().frameRate && (O.requestHighFrameRate = !0, e < 14 && (O.videoHeight = 360, O.getDataSize = (e) => e === y.HIGH ? [640, 360] : [320, 180])), 16 === e && t >= 4 && (O.ios164CameraSelection = !0), e >= 17 && (O.relyOnConstraintsForCameraSelection = !0);
		}
	}
	function U(e, r, t) {
		let a = e.createShader(r);
		if (!a) throw new Error("Unable to create shader");
		e.shaderSource(a, t), e.compileShader(a);
		let n = e.getShaderInfoLog(a);
		if (n && n.trim().length > 0) throw new Error("Shader compile error: " + n);
		return a;
	}
	"webkit" === B && "ios" !== D && (O.deviceMotionMutliplier = 1, "undefined" != typeof window && void 0 !== window.orientation && N("15.0")), "webkit" === B && "ios" === D && (O.deviceMotionMutliplier = 1, N(C.getOS().version || "15.0"));
	var V = class {
		constructor(e) {
			this._gl = e, this._isPaused = !0, this._hadFrames = !1, this._isUserFacing = !1, this._cameraToScreenRotation = 0, this._isUploadFrame = !0, this._computedTransformRotation = -1, this._computedFrontCameraRotation = !1, this._cameraUvTransform = R(), this._framebufferWidth = 0, this._framebufferHeight = 0, this._framebufferId = null, this._renderTexture = null, this._isWebGL2 = !1, this._isWebGL2 = e.getParameter(e.VERSION).indexOf("WebGL 2") >= 0, this._isWebGL2 || (this._instancedArraysExtension = this._gl.getExtension("ANGLE_instanced_arrays"));
		}
		resetGLContext() {
			this._framebufferId = null, this._renderTexture = null, this._vertexBuffer = void 0, this._indexBuffer = void 0, this._greyscaleShader = void 0;
		}
		destroy() {
			this.resetGLContext();
		}
		uploadFrame(e, r, t, a, n) {
			const [i, o] = O.getDataSize(n);
			this.uploadFrameForSize(e, r, t, a, i, o);
		}
		uploadFrameForSize(e, r, t, a, n, i) {
			let o = this._gl;
			const s = P.get(o);
			s.push();
			const _ = o.isEnabled(o.SCISSOR_TEST), c = o.isEnabled(o.DEPTH_TEST), l = o.isEnabled(o.BLEND), p = o.isEnabled(o.CULL_FACE), u = o.isEnabled(o.STENCIL_TEST), d = o.getParameter(o.ACTIVE_TEXTURE), m = o.getParameter(o.UNPACK_FLIP_Y_WEBGL), f = o.getParameter(o.CURRENT_PROGRAM);
			o.activeTexture(o.TEXTURE0);
			const h = o.getParameter(o.TEXTURE_BINDING_2D), b = o.getParameter(o.FRAMEBUFFER_BINDING), w = o.getParameter(o.ARRAY_BUFFER_BINDING), g = o.getParameter(o.ELEMENT_ARRAY_BUFFER_BINDING);
			o.disable(o.SCISSOR_TEST), o.disable(o.DEPTH_TEST), o.disable(o.BLEND), o.disable(o.CULL_FACE), o.disable(o.STENCIL_TEST), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, !1), o.bindTexture(o.TEXTURE_2D, e);
			const y = o.RGBA, v = o.RGBA, k = o.UNSIGNED_BYTE;
			o.texImage2D(o.TEXTURE_2D, 0, y, v, k, r);
			let E = 0, A = 0;
			"undefined" != typeof HTMLVideoElement && r instanceof HTMLVideoElement ? (E = r.videoWidth, A = r.videoHeight) : (E = r.width, A = r.height), A > E && (A = [E, E = A][0]), this._updateTransforms(t, a);
			let z = this._getFramebuffer(o, n / 4, i), x = this._getVertexBuffer(o), T = this._getIndexBuffer(o), R = this._getGreyscaleShader(o);
			const L = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_SIZE), F = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_TYPE), M = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_NORMALIZED), S = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_STRIDE), I = o.getVertexAttribOffset(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_POINTER), O = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_ENABLED), C = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING), D = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_SIZE), B = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_TYPE), N = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_NORMALIZED), U = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_STRIDE), V = o.getVertexAttribOffset(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_POINTER), G = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING), H = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_ENABLED);
			let X = 0, W = 0;
			this._isWebGL2 ? (X = o.getVertexAttrib(R.aVertexPositionLoc, o.VERTEX_ATTRIB_ARRAY_DIVISOR), W = o.getVertexAttrib(R.aTextureCoordLoc, o.VERTEX_ATTRIB_ARRAY_DIVISOR), o.vertexAttribDivisor(R.aVertexPositionLoc, 0), o.vertexAttribDivisor(R.aTextureCoordLoc, 0)) : this._instancedArraysExtension && (X = o.getVertexAttrib(R.aVertexPositionLoc, this._instancedArraysExtension.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE), W = o.getVertexAttrib(R.aTextureCoordLoc, this._instancedArraysExtension.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE), this._instancedArraysExtension.vertexAttribDivisorANGLE(R.aVertexPositionLoc, 0), this._instancedArraysExtension.vertexAttribDivisorANGLE(R.aTextureCoordLoc, 0)), o.bindFramebuffer(o.FRAMEBUFFER, z), o.viewport(0, 0, this._framebufferWidth, this._framebufferHeight), o.clear(o.COLOR_BUFFER_BIT), o.bindBuffer(o.ARRAY_BUFFER, x), o.vertexAttribPointer(R.aVertexPositionLoc, 2, o.FLOAT, !1, 16, 0), o.enableVertexAttribArray(R.aVertexPositionLoc), o.vertexAttribPointer(R.aTextureCoordLoc, 2, o.FLOAT, !1, 16, 8), o.enableVertexAttribArray(R.aTextureCoordLoc), o.bindBuffer(o.ELEMENT_ARRAY_BUFFER, T), o.useProgram(R.program), o.uniform1f(R.uTexWidthLoc, n), o.uniformMatrix4fv(R.uUvTransformLoc, !1, this._cameraUvTransform), o.activeTexture(o.TEXTURE0), o.bindTexture(o.TEXTURE_2D, e), o.uniform1i(R.uSamplerLoc, 0), o.drawElements(o.TRIANGLES, 6, o.UNSIGNED_SHORT, 0), o.bindBuffer(o.ARRAY_BUFFER, C), o.vertexAttribPointer(R.aVertexPositionLoc, L, F, M, S, I), o.bindBuffer(o.ARRAY_BUFFER, G), o.vertexAttribPointer(R.aTextureCoordLoc, D, B, N, U, V), o.bindBuffer(o.ARRAY_BUFFER, w), o.bindBuffer(o.ELEMENT_ARRAY_BUFFER, g), O || o.disableVertexAttribArray(R.aVertexPositionLoc), H || o.disableVertexAttribArray(R.aTextureCoordLoc), this._isWebGL2 ? (o.vertexAttribDivisor(R.aVertexPositionLoc, X), o.vertexAttribDivisor(R.aTextureCoordLoc, W)) : this._instancedArraysExtension && (this._instancedArraysExtension.vertexAttribDivisorANGLE(R.aVertexPositionLoc, X), this._instancedArraysExtension.vertexAttribDivisorANGLE(R.aTextureCoordLoc, W)), o.bindFramebuffer(o.FRAMEBUFFER, b), o.useProgram(f), o.bindTexture(o.TEXTURE_2D, h), o.activeTexture(d), o.pixelStorei(o.UNPACK_FLIP_Y_WEBGL, m), s.pop(), l && o.enable(o.BLEND), p && o.enable(o.CULL_FACE), c && o.enable(o.DEPTH_TEST), _ && o.enable(o.SCISSOR_TEST), u && o.enable(o.STENCIL_TEST);
		}
		readFrame(e, r, t) {
			const [a, n] = O.getDataSize(t);
			return this.readFrameForSize(e, r, a, n);
		}
		readFrameForSize(e, r, t, a) {
			let n = this._gl, i = new Uint8Array(r);
			const o = n.getParameter(n.FRAMEBUFFER_BINDING);
			let s = this._getFramebuffer(n, t / 4, a);
			return n.bindFramebuffer(n.FRAMEBUFFER, s), n.readPixels(0, 0, this._framebufferWidth, this._framebufferHeight, n.RGBA, n.UNSIGNED_BYTE, i), n.bindFramebuffer(n.FRAMEBUFFER, o), {
				uvTransform: this._cameraUvTransform,
				data: r,
				texture: e,
				dataWidth: t,
				dataHeight: a,
				userFacing: this._computedFrontCameraRotation
			};
		}
		_updateTransforms(e, r) {
			e == this._computedTransformRotation && r == this._computedFrontCameraRotation || (this._computedTransformRotation = e, this._computedFrontCameraRotation = r, this._cameraUvTransform = this._getCameraUvTransform());
		}
		_getCameraUvTransform() {
			switch (this._computedTransformRotation) {
				case 270: return new Float32Array([
					0,
					1,
					0,
					0,
					-1,
					0,
					0,
					0,
					0,
					0,
					1,
					0,
					1,
					0,
					0,
					1
				]);
				case 180: return new Float32Array([
					-1,
					0,
					0,
					0,
					0,
					-1,
					0,
					0,
					0,
					0,
					1,
					0,
					1,
					1,
					0,
					1
				]);
				case 90: return new Float32Array([
					0,
					-1,
					0,
					0,
					1,
					0,
					0,
					0,
					0,
					0,
					1,
					0,
					0,
					1,
					0,
					1
				]);
			}
			return new Float32Array([
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				1
			]);
		}
		_getFramebuffer(e, r, t) {
			if (this._framebufferWidth === r && this._framebufferHeight === t && this._framebufferId) return this._framebufferId;
			if (this._framebufferId && (e.deleteFramebuffer(this._framebufferId), this._framebufferId = null), this._renderTexture && (e.deleteTexture(this._renderTexture), this._renderTexture = null), this._framebufferId = e.createFramebuffer(), !this._framebufferId) throw new Error("Unable to create framebuffer");
			if (e.bindFramebuffer(e.FRAMEBUFFER, this._framebufferId), this._renderTexture = e.createTexture(), !this._renderTexture) throw new Error("Unable to create render texture");
			e.activeTexture(e.TEXTURE0);
			const a = e.getParameter(e.TEXTURE_BINDING_2D);
			e.bindTexture(e.TEXTURE_2D, this._renderTexture), e.texImage2D(e.TEXTURE_2D, 0, e.RGBA, r, t, 0, e.RGBA, e.UNSIGNED_BYTE, null), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameterf(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.framebufferTexture2D(e.FRAMEBUFFER, e.COLOR_ATTACHMENT0, e.TEXTURE_2D, this._renderTexture, 0);
			let n = e.checkFramebufferStatus(e.FRAMEBUFFER);
			if (n !== e.FRAMEBUFFER_COMPLETE) throw new Error("Framebuffer not complete: " + n.toString());
			return this._framebufferWidth = r, this._framebufferHeight = t, e.bindTexture(e.TEXTURE_2D, a), e.bindFramebuffer(e.FRAMEBUFFER, null), this._framebufferId;
		}
		_getVertexBuffer(e) {
			if (this._vertexBuffer) return this._vertexBuffer;
			if (this._vertexBuffer = e.createBuffer(), !this._vertexBuffer) throw new Error("Unable to create vertex buffer");
			e.bindBuffer(e.ARRAY_BUFFER, this._vertexBuffer);
			let r = new Float32Array([
				-1,
				-1,
				0,
				0,
				-1,
				1,
				0,
				1,
				1,
				1,
				1,
				1,
				1,
				-1,
				1,
				0
			]);
			return e.bufferData(e.ARRAY_BUFFER, r, e.STATIC_DRAW), this._vertexBuffer;
		}
		_getIndexBuffer(e) {
			if (this._indexBuffer) return this._indexBuffer;
			if (this._indexBuffer = e.createBuffer(), !this._indexBuffer) throw new Error("Unable to create index buffer");
			e.bindBuffer(e.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
			let r = new Uint16Array([
				0,
				1,
				2,
				0,
				2,
				3
			]);
			return e.bufferData(e.ELEMENT_ARRAY_BUFFER, r, e.STATIC_DRAW), this._indexBuffer;
		}
		_getGreyscaleShader(e) {
			if (this._greyscaleShader) return this._greyscaleShader;
			let r = e.createProgram();
			if (!r) throw new Error("Unable to create program");
			let t = U(e, e.VERTEX_SHADER, q), a = U(e, e.FRAGMENT_SHADER, Y);
			e.attachShader(r, t), e.attachShader(r, a), function(e, r) {
				e.linkProgram(r);
				let t = e.getProgramInfoLog(r);
				if (t && t.trim().length > 0) throw new Error("Unable to link: " + t);
			}(e, r);
			let n = e.getUniformLocation(r, "uTexWidth");
			if (!n) throw new Error("Unable to get uniform location uTexWidth");
			let i = e.getUniformLocation(r, "uUvTransform");
			if (!i) throw new Error("Unable to get uniform location uUvTransform");
			let o = e.getUniformLocation(r, "uSampler");
			if (!o) throw new Error("Unable to get uniform location uSampler");
			return this._greyscaleShader = {
				program: r,
				aVertexPositionLoc: e.getAttribLocation(r, "aVertexPosition"),
				aTextureCoordLoc: e.getAttribLocation(r, "aTextureCoord"),
				uTexWidthLoc: n,
				uUvTransformLoc: i,
				uSamplerLoc: o
			}, this._greyscaleShader;
		}
	};
	let G, H, X, W, q = "\n    attribute vec4 aVertexPosition;\n    attribute vec2 aTextureCoord;\n\n    varying highp vec2 vTextureCoord1;\n    varying highp vec2 vTextureCoord2;\n    varying highp vec2 vTextureCoord3;\n    varying highp vec2 vTextureCoord4;\n\n    uniform float uTexWidth;\n	uniform mat4 uUvTransform;\n\n    void main(void) {\n      highp vec2 offset1 = vec2(1.5 / uTexWidth, 0);\n      highp vec2 offset2 = vec2(0.5 / uTexWidth, 0);\n\n      gl_Position = aVertexPosition;\n      vTextureCoord1 = (uUvTransform * vec4(aTextureCoord - offset1, 0, 1)).xy;\n      vTextureCoord2 = (uUvTransform * vec4(aTextureCoord - offset2, 0, 1)).xy;\n      vTextureCoord3 = (uUvTransform * vec4(aTextureCoord + offset2, 0, 1)).xy;\n      vTextureCoord4 = (uUvTransform * vec4(aTextureCoord + offset1, 0, 1)).xy;\n    }\n", Y = "\n  varying highp vec2 vTextureCoord1;\n  varying highp vec2 vTextureCoord2;\n  varying highp vec2 vTextureCoord3;\n  varying highp vec2 vTextureCoord4;\n\n  uniform sampler2D uSampler;\n\n  const lowp vec3 colorWeights = vec3(77.0 / 256.0, 150.0 / 256.0, 29.0 / 256.0);\n\n  void main(void) {\n    lowp vec4 outpx;\n\n    outpx.r = dot(colorWeights, texture2D(uSampler, vTextureCoord1).xyz);\n    outpx.g = dot(colorWeights, texture2D(uSampler, vTextureCoord2).xyz);\n    outpx.b = dot(colorWeights, texture2D(uSampler, vTextureCoord3).xyz);\n    outpx.a = dot(colorWeights, texture2D(uSampler, vTextureCoord4).xyz);\n\n    gl_FragColor = outpx;\n  }\n";
	function j(e, r, t, a) {
		const [n, i] = function() {
			if (!X || !W) {
				if (W = new OffscreenCanvas(1, 1).getContext("webgl"), !W) throw new Error("Unable to get offscreen GL context");
				X = new V(W);
			}
			return [X, W];
		}();
		if (H || (H = i.createTexture(), i.bindTexture(i.TEXTURE_2D, H), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_S, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_WRAP_T, i.CLAMP_TO_EDGE), i.texParameteri(i.TEXTURE_2D, i.TEXTURE_MIN_FILTER, i.LINEAR)), !H) return;
		let [o, s] = O.getDataSize(e.cp), _ = 90 == e.r || 270 == e.r, c = _ ? e.i.height : e.i.width, l = _ ? e.i.width : e.i.height, p = Math.round(o * l / c);
		p < s ? s = p : o = Math.round(s * c / l), (!G || G.byteLength < o * s) && (G = new ArrayBuffer(o * s)), n.uploadFrameForSize(H, e.i, e.r, e.userFacing, o, s);
		let u = n.readFrameForSize(H, G, o, s), d = {
			t: "imageBitmapS2C",
			dataWidth: u.dataWidth,
			dataHeight: u.dataHeight,
			frame: e.i,
			userFacing: u.userFacing,
			uvTransform: u.uvTransform || R(),
			tokenId: e.tokenId,
			p: e.p,
			data: e.requestData ? u.data : void 0
		};
		a.postOutgoingMessage(d, [e.i]);
		let m = t._pipeline_by_instance.get(e.p);
		m && (r.pipeline_camera_frame_submit(m, G, u.dataWidth, u.dataHeight, e.tokenId, e.cameraToDevice, e.cameraModel, u.userFacing, performance.now()), r.pipeline_frame_update(m), t.exploreState());
	}
	var Z = function(e, r, t, a) {
		return new (t || (t = Promise))(function(n, i) {
			function o(e) {
				try {
					_(a.next(e));
				} catch (r) {
					i(r);
				}
			}
			function s(e) {
				try {
					_(a.throw(e));
				} catch (r) {
					i(r);
				}
			}
			function _(e) {
				var r;
				e.done ? n(e.value) : (r = e.value, r instanceof t ? r : new t(function(e) {
					e(r);
				})).then(o, s);
			}
			_((a = a.apply(e, r || [])).next());
		});
	};
	let K, $, Q = new class {
		constructor() {
			this.onOutgoingMessage = new z(), this.onIncomingMessage = new x(), this._outgoingMessages = [];
		}
		postIncomingMessage(e) {
			this.onIncomingMessage.emit(e);
		}
		postOutgoingMessage(e, r) {
			this._outgoingMessages.push({
				msg: e,
				transferables: r
			}), this.onOutgoingMessage.emit();
		}
		getOutgoingMessages() {
			let e = this._outgoingMessages;
			return this._outgoingMessages = [], e;
		}
	}(), J = 0, ee = !1;
	const re = /* @__PURE__ */ new Map(), te = /* @__PURE__ */ new Map();
	function ae(e, r, t) {
		return Z(this, void 0, void 0, function* () {
			let a = c({
				locateFile: (r, t) => r.endsWith("zappar-cv.wasm") ? e : t + r,
				instantiateWasm: (e, t) => {
					const a = new WebAssembly.Instance(r, e);
					return t(a), a.exports;
				},
				onRuntimeInitialized: () => {
					let e = function(e) {
						let r = e.cwrap("zappar_log_level", "number", []), t = e.cwrap("zappar_log_level_set", null, ["number"]), a = e.cwrap("zappar_analytics_project_id_set", null, ["string", "string"]), n = e.cwrap("zappar_pipeline_create", "number", []), i = e.cwrap("zappar_pipeline_destroy", null, ["number"]), o = e.cwrap("zappar_pipeline_camera_frame_data_raw", "number", ["number"]), s = e.cwrap("zappar_pipeline_camera_frame_data_raw_size", "number", ["number"]), _ = e.cwrap("zappar_pipeline_frame_update", null, ["number"]), c = e.cwrap("zappar_pipeline_frame_number", "number", ["number"]), l = e.cwrap("zappar_pipeline_camera_model", "number", ["number"]), p = e.cwrap("zappar_pipeline_camera_data_width", "number", ["number"]), u = e.cwrap("zappar_pipeline_camera_data_height", "number", ["number"]), d = e.cwrap("zappar_pipeline_camera_frame_sharpness_enabled", "number", ["number"]), m = e.cwrap("zappar_pipeline_camera_frame_sharpness_enabled_set", null, ["number", "number"]), f = e.cwrap("zappar_pipeline_camera_frame_sharpness", "number", ["number"]), h = e.cwrap("zappar_pipeline_camera_frame_user_data", "number", ["number"]), b = e.cwrap("zappar_pipeline_camera_frame_submit", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), w = e.cwrap("zappar_pipeline_camera_frame_submit_raw_pointer", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), g = e.cwrap("zappar_pipeline_camera_frame_camera_attitude", "number", ["number"]), y = e.cwrap("zappar_pipeline_camera_frame_device_attitude", "number", ["number"]), v = e.cwrap("zappar_pipeline_motion_accelerometer_submit", null, [
							"number",
							"number",
							"number",
							"number",
							"number"
						]), k = e.cwrap("zappar_pipeline_motion_accelerometer_with_gravity_submit_int", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), E = e.cwrap("zappar_pipeline_motion_accelerometer_without_gravity_submit_int", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), A = e.cwrap("zappar_pipeline_motion_rotation_rate_submit", null, [
							"number",
							"number",
							"number",
							"number",
							"number"
						]), z = e.cwrap("zappar_pipeline_motion_rotation_rate_submit_int", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), x = e.cwrap("zappar_pipeline_motion_attitude_submit", null, [
							"number",
							"number",
							"number",
							"number",
							"number"
						]), T = e.cwrap("zappar_pipeline_motion_attitude_submit_int", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), R = e.cwrap("zappar_pipeline_motion_relative_orientation_submit_int", null, [
							"number",
							"number",
							"number",
							"number",
							"number",
							"number",
							"number"
						]), L = e.cwrap("zappar_pipeline_motion_attitude_matrix_submit", null, ["number", "number"]), F = e.cwrap("zappar_camera_source_create", "number", ["number", "string"]), M = e.cwrap("zappar_camera_source_destroy", null, ["number"]), S = e.cwrap("zappar_sequence_source_create", "number", ["number"]), P = e.cwrap("zappar_sequence_source_destroy", null, ["number"]), I = e.cwrap("zappar_image_tracker_create", "number", ["number"]), O = e.cwrap("zappar_image_tracker_destroy", null, ["number"]), C = e.cwrap("zappar_image_tracker_target_load_from_memory", null, [
							"number",
							"number",
							"number"
						]), D = e.cwrap("zappar_image_tracker_target_loaded_version", "number", ["number"]), B = e.cwrap("zappar_image_tracker_enabled", "number", ["number"]), N = e.cwrap("zappar_image_tracker_enabled_set", null, ["number", "number"]), U = e.cwrap("zappar_image_tracker_anchor_count", "number", ["number"]), V = e.cwrap("zappar_image_tracker_anchor_id", "string", ["number", "number"]), G = e.cwrap("zappar_image_tracker_anchor_pose_raw", "number", ["number", "number"]), H = e.cwrap("zappar_face_tracker_create", "number", ["number"]), X = e.cwrap("zappar_face_tracker_destroy", null, ["number"]), W = e.cwrap("zappar_face_tracker_model_load_from_memory", null, [
							"number",
							"number",
							"number"
						]), q = e.cwrap("zappar_face_tracker_model_loaded_version", "number", ["number"]), Y = e.cwrap("zappar_face_tracker_enabled_set", null, ["number", "number"]), j = e.cwrap("zappar_face_tracker_enabled", "number", ["number"]), Z = e.cwrap("zappar_face_tracker_max_faces_set", null, ["number", "number"]), K = e.cwrap("zappar_face_tracker_max_faces", "number", ["number"]), $ = e.cwrap("zappar_face_tracker_anchor_count", "number", ["number"]), Q = e.cwrap("zappar_face_tracker_anchor_id", "string", ["number", "number"]), J = e.cwrap("zappar_face_tracker_anchor_pose_raw", "number", ["number", "number"]), ee = e.cwrap("zappar_face_tracker_anchor_identity_coefficients", "number", ["number", "number"]), re = e.cwrap("zappar_face_tracker_anchor_expression_coefficients", "number", ["number", "number"]), te = e.cwrap("zappar_face_mesh_create", "number", []), ae = e.cwrap("zappar_face_mesh_destroy", null, ["number"]), ne = e.cwrap("zappar_face_landmark_create", "number", ["number"]), ie = e.cwrap("zappar_face_landmark_destroy", null, ["number"]), oe = e.cwrap("zappar_barcode_finder_create", "number", ["number"]), se = e.cwrap("zappar_barcode_finder_destroy", null, ["number"]), _e = e.cwrap("zappar_barcode_finder_enabled_set", null, ["number", "number"]), ce = e.cwrap("zappar_barcode_finder_enabled", "number", ["number"]), le = e.cwrap("zappar_barcode_finder_found_number", "number", ["number"]), pe = e.cwrap("zappar_barcode_finder_found_text", "string", ["number", "number"]), ue = e.cwrap("zappar_barcode_finder_found_format", "number", ["number", "number"]), de = e.cwrap("zappar_barcode_finder_formats", "number", ["number"]), me = e.cwrap("zappar_barcode_finder_formats_set", null, ["number", "number"]), fe = e.cwrap("zappar_instant_world_tracker_create", "number", ["number"]), he = e.cwrap("zappar_instant_world_tracker_destroy", null, ["number"]), be = e.cwrap("zappar_instant_world_tracker_enabled_set", null, ["number", "number"]), we = e.cwrap("zappar_instant_world_tracker_enabled", "number", ["number"]), ge = e.cwrap("zappar_instant_world_tracker_anchor_pose_raw", "number", ["number"]), ye = e.cwrap("zappar_instant_world_tracker_anchor_pose_set_from_camera_offset_raw", null, [
							"number",
							"number",
							"number",
							"number",
							"number"
						]), ve = e.cwrap("zappar_zapcode_tracker_create", "number", ["number"]), ke = e.cwrap("zappar_zapcode_tracker_destroy", null, ["number"]), Ee = e.cwrap("zappar_zapcode_tracker_target_load_from_memory", null, [
							"number",
							"number",
							"number"
						]), Ae = e.cwrap("zappar_zapcode_tracker_target_loaded_version", "number", ["number"]), ze = e.cwrap("zappar_zapcode_tracker_enabled", "number", ["number"]), xe = e.cwrap("zappar_zapcode_tracker_enabled_set", null, ["number", "number"]), Te = e.cwrap("zappar_zapcode_tracker_anchor_count", "number", ["number"]), Re = e.cwrap("zappar_zapcode_tracker_anchor_id", "string", ["number", "number"]), Le = e.cwrap("zappar_zapcode_tracker_anchor_pose_raw", "number", ["number", "number"]), Fe = e.cwrap("zappar_world_tracker_create", "number", ["number"]), Me = e.cwrap("zappar_world_tracker_destroy", null, ["number"]), Se = e.cwrap("zappar_world_tracker_enabled", "number", ["number"]), Pe = e.cwrap("zappar_world_tracker_enabled_set", null, ["number", "number"]), Ie = e.cwrap("zappar_world_tracker_scale_mode", "number", ["number"]), Oe = e.cwrap("zappar_world_tracker_scale_mode_set", null, ["number", "number"]), Ce = e.cwrap("zappar_world_tracker_session_number", "number", ["number"]), De = e.cwrap("zappar_world_tracker_quality", "number", ["number"]), Be = e.cwrap("zappar_world_tracker_horizontal_plane_detection_enabled", "number", ["number"]), Ne = e.cwrap("zappar_world_tracker_horizontal_plane_detection_enabled_set", null, ["number", "number"]), Ue = e.cwrap("zappar_world_tracker_vertical_plane_detection_enabled", "number", ["number"]), Ve = e.cwrap("zappar_world_tracker_vertical_plane_detection_enabled_set", null, ["number", "number"]), Ge = e.cwrap("zappar_world_tracker_plane_anchor_count", "number", ["number"]), He = e.cwrap("zappar_world_tracker_plane_anchor_id", "string", ["number", "number"]), Xe = e.cwrap("zappar_world_tracker_plane_anchor_pose_raw", "number", ["number", "number"]), We = e.cwrap("zappar_world_tracker_plane_anchor_status", "number", ["number", "number"]), qe = e.cwrap("zappar_world_tracker_plane_anchor_polygon_data_size", "number", ["number", "number"]), Ye = e.cwrap("zappar_world_tracker_plane_anchor_polygon_data", "number", ["number", "number"]), je = e.cwrap("zappar_world_tracker_plane_anchor_polygon_version", "number", ["number", "number"]), Ze = e.cwrap("zappar_world_tracker_plane_anchor_orientation", "number", ["number", "number"]), Ke = e.cwrap("zappar_world_tracker_world_anchor_status", "number", ["number"]), $e = e.cwrap("zappar_world_tracker_world_anchor_id", "string", ["number"]), Qe = e.cwrap("zappar_world_tracker_world_anchor_pose_raw", "number", ["number"]), Je = e.cwrap("zappar_world_tracker_ground_anchor_id", "string", ["number"]), er = e.cwrap("zappar_world_tracker_ground_anchor_status", "number", ["number"]), rr = e.cwrap("zappar_world_tracker_ground_anchor_pose_raw", "number", ["number"]), tr = e.cwrap("zappar_world_tracker_reset", null, ["number"]), ar = e.cwrap("zappar_world_tracker_tracks_data_enabled", "number", ["number"]), nr = e.cwrap("zappar_world_tracker_tracks_data_enabled_set", null, ["number", "number"]), ir = e.cwrap("zappar_world_tracker_tracks_data_size", "number", ["number"]), or = e.cwrap("zappar_world_tracker_tracks_data", "number", ["number"]), sr = e.cwrap("zappar_world_tracker_tracks_type_data_size", "number", ["number"]), _r = e.cwrap("zappar_world_tracker_tracks_type_data", "number", ["number"]), cr = e.cwrap("zappar_world_tracker_projections_data_enabled", "number", ["number"]), lr = e.cwrap("zappar_world_tracker_projections_data_enabled_set", null, ["number", "number"]), pr = e.cwrap("zappar_world_tracker_projections_data_size", "number", ["number"]), ur = e.cwrap("zappar_world_tracker_projections_data", "number", ["number"]), dr = e.cwrap("zappar_custom_anchor_create", "number", [
							"number",
							"number",
							"string"
						]), mr = e.cwrap("zappar_custom_anchor_destroy", null, ["number"]), fr = e.cwrap("zappar_custom_anchor_status", "number", ["number"]), hr = e.cwrap("zappar_custom_anchor_pose_version", "number", ["number"]), br = e.cwrap("zappar_custom_anchor_pose_raw", "number", ["number"]), wr = e.cwrap("zappar_custom_anchor_pose_set_from_camera_offset_raw", null, [
							"number",
							"number",
							"number",
							"number",
							"number"
						]), gr = e.cwrap("zappar_custom_anchor_pose_set_from_anchor_offset", null, [
							"number",
							"string",
							"number",
							"number",
							"number",
							"number"
						]), yr = e.cwrap("zappar_custom_anchor_pose_set", null, ["number", "number"]), vr = e.cwrap("zappar_custom_anchor_pose_set_with_parent", null, [
							"number",
							"number",
							"string"
						]), kr = e.cwrap("zappar_d3_tracker_create", "number", ["number"]), Er = e.cwrap("zappar_d3_tracker_destroy", null, ["number"]), Ar = 32, zr = e._malloc(Ar);
						e._malloc(64);
						let xr = /* @__PURE__ */ new Map(), Tr = (r, t) => {
							let a = xr.get(r);
							return (!a || a[0] < t) && (a && e._free(a[1]), a = [t, e._malloc(t)], xr.set(r, a)), a[1];
						};
						return {
							log_level: () => r(),
							log_level_set: (e) => t(e),
							analytics_project_id_set: (e, r) => a(e, r),
							pipeline_create: () => n(),
							pipeline_destroy: () => {
								i();
							},
							pipeline_camera_frame_data_raw: (e) => o(e),
							pipeline_camera_frame_data_raw_size: (e) => s(e),
							pipeline_frame_update: (e) => _(e),
							pipeline_frame_number: (e) => c(e),
							pipeline_camera_model: (r) => {
								let t = l(r), a = new Float32Array(6);
								return a.set(e.HEAPF32.subarray(t / 4, 6 + t / 4)), t = a, t;
							},
							pipeline_camera_data_width: (e) => p(e),
							pipeline_camera_data_height: (e) => u(e),
							pipeline_camera_frame_sharpness_enabled: (e) => {
								let r = d(e);
								return r = 1 === r, r;
							},
							pipeline_camera_frame_sharpness_enabled_set: (e, r) => m(e, r ? 1 : 0),
							pipeline_camera_frame_sharpness: (e) => f(e),
							pipeline_camera_frame_user_data: (e) => h(e),
							pipeline_camera_frame_submit: (r, t, a, n, i, o, s, _, c) => {
								Ar < t.byteLength && (e._free(zr), Ar = t.byteLength, zr = e._malloc(Ar));
								let l = zr, p = t.byteLength;
								e.HEAPU8.set(new Uint8Array(t), zr);
								let u = a, d = n, m = i, f = Tr(4, o.byteLength);
								e.HEAPF32.set(o, f / 4);
								let h = Tr(5, s.byteLength);
								return e.HEAPF32.set(s, h / 4), b(r, l, p, u, d, m, f, h, _ ? 1 : 0, c);
							},
							pipeline_camera_frame_submit_raw_pointer: (r, t, a, n, i, o, s, _, c, l, p, u, d) => {
								let m = t, f = a, h = n, b = i, g = o, y = s, v = Tr(6, _.byteLength);
								e.HEAPF32.set(_, v / 4);
								let k = c, E = Tr(8, l.byteLength);
								return e.HEAPF32.set(l, E / 4), w(r, m, f, h, b, g, y, v, k, E, p ? 1 : 0, u, d ? 1 : 0);
							},
							pipeline_camera_frame_camera_attitude: (r) => {
								let t = g(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							pipeline_camera_frame_device_attitude: (r) => {
								let t = y(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							pipeline_motion_accelerometer_submit: (e, r, t, a, n) => v(e, r, t, a, n),
							pipeline_motion_accelerometer_with_gravity_submit_int: (e, r, t, a, n, i) => k(e, r, t, a, n, i),
							pipeline_motion_accelerometer_without_gravity_submit_int: (e, r, t, a, n, i) => E(e, r, t, a, n, i),
							pipeline_motion_rotation_rate_submit: (e, r, t, a, n) => A(e, r, t, a, n),
							pipeline_motion_rotation_rate_submit_int: (e, r, t, a, n, i) => z(e, r, t, a, n, i),
							pipeline_motion_attitude_submit: (e, r, t, a, n) => x(e, r, t, a, n),
							pipeline_motion_attitude_submit_int: (e, r, t, a, n, i) => T(e, r, t, a, n, i),
							pipeline_motion_relative_orientation_submit_int: (e, r, t, a, n, i, o) => R(e, r, t, a, n, i, o),
							pipeline_motion_attitude_matrix_submit: (r, t) => {
								let a = Tr(0, t.byteLength);
								return e.HEAPF32.set(t, a / 4), L(r, a);
							},
							camera_source_create: (e, r) => F(e, r),
							camera_source_destroy: () => {
								M();
							},
							sequence_source_create: (e) => S(e),
							sequence_source_destroy: () => {
								P();
							},
							image_tracker_create: (e) => I(e),
							image_tracker_destroy: () => {
								O();
							},
							image_tracker_target_load_from_memory: (r, t) => {
								Ar < t.byteLength && (e._free(zr), Ar = t.byteLength, zr = e._malloc(Ar));
								let a = zr, n = t.byteLength;
								return e.HEAPU8.set(new Uint8Array(t), zr), C(r, a, n);
							},
							image_tracker_target_loaded_version: (e) => D(e),
							image_tracker_enabled: (e) => {
								let r = B(e);
								return r = 1 === r, r;
							},
							image_tracker_enabled_set: (e, r) => N(e, r ? 1 : 0),
							image_tracker_anchor_count: (e) => U(e),
							image_tracker_anchor_id: (e, r) => V(e, r),
							image_tracker_anchor_pose_raw: (r, t) => {
								let a = G(r, t), n = new Float32Array(16);
								return n.set(e.HEAPF32.subarray(a / 4, 16 + a / 4)), a = n, a;
							},
							face_tracker_create: (e) => H(e),
							face_tracker_destroy: () => {
								X();
							},
							face_tracker_model_load_from_memory: (r, t) => {
								Ar < t.byteLength && (e._free(zr), Ar = t.byteLength, zr = e._malloc(Ar));
								let a = zr, n = t.byteLength;
								return e.HEAPU8.set(new Uint8Array(t), zr), W(r, a, n);
							},
							face_tracker_model_loaded_version: (e) => q(e),
							face_tracker_enabled_set: (e, r) => Y(e, r ? 1 : 0),
							face_tracker_enabled: (e) => {
								let r = j(e);
								return r = 1 === r, r;
							},
							face_tracker_max_faces_set: (e, r) => Z(e, r),
							face_tracker_max_faces: (e) => K(e),
							face_tracker_anchor_count: (e) => $(e),
							face_tracker_anchor_id: (e, r) => Q(e, r),
							face_tracker_anchor_pose_raw: (r, t) => {
								let a = J(r, t), n = new Float32Array(16);
								return n.set(e.HEAPF32.subarray(a / 4, 16 + a / 4)), a = n, a;
							},
							face_tracker_anchor_identity_coefficients: (r, t) => {
								let a = ee(r, t), n = new Float32Array(50);
								return n.set(e.HEAPF32.subarray(a / 4, 50 + a / 4)), a = n, a;
							},
							face_tracker_anchor_expression_coefficients: (r, t) => {
								let a = re(r, t), n = new Float32Array(29);
								return n.set(e.HEAPF32.subarray(a / 4, 29 + a / 4)), a = n, a;
							},
							face_mesh_create: () => te(),
							face_mesh_destroy: () => {
								ae();
							},
							face_landmark_create: (e) => ne(e),
							face_landmark_destroy: () => {
								ie();
							},
							barcode_finder_create: (e) => oe(e),
							barcode_finder_destroy: () => {
								se();
							},
							barcode_finder_enabled_set: (e, r) => _e(e, r ? 1 : 0),
							barcode_finder_enabled: (e) => {
								let r = ce(e);
								return r = 1 === r, r;
							},
							barcode_finder_found_number: (e) => le(e),
							barcode_finder_found_text: (e, r) => pe(e, r),
							barcode_finder_found_format: (e, r) => ue(e, r),
							barcode_finder_formats: (e) => de(e),
							barcode_finder_formats_set: (e, r) => me(e, r),
							instant_world_tracker_create: (e) => fe(e),
							instant_world_tracker_destroy: () => {
								he();
							},
							instant_world_tracker_enabled_set: (e, r) => be(e, r ? 1 : 0),
							instant_world_tracker_enabled: (e) => {
								let r = we(e);
								return r = 1 === r, r;
							},
							instant_world_tracker_anchor_pose_raw: (r) => {
								let t = ge(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							instant_world_tracker_anchor_pose_set_from_camera_offset_raw: (e, r, t, a, n) => ye(e, r, t, a, n),
							zapcode_tracker_create: (e) => ve(e),
							zapcode_tracker_destroy: () => {
								ke();
							},
							zapcode_tracker_target_load_from_memory: (r, t) => {
								Ar < t.byteLength && (e._free(zr), Ar = t.byteLength, zr = e._malloc(Ar));
								let a = zr, n = t.byteLength;
								return e.HEAPU8.set(new Uint8Array(t), zr), Ee(r, a, n);
							},
							zapcode_tracker_target_loaded_version: (e) => Ae(e),
							zapcode_tracker_enabled: (e) => {
								let r = ze(e);
								return r = 1 === r, r;
							},
							zapcode_tracker_enabled_set: (e, r) => xe(e, r ? 1 : 0),
							zapcode_tracker_anchor_count: (e) => Te(e),
							zapcode_tracker_anchor_id: (e, r) => Re(e, r),
							zapcode_tracker_anchor_pose_raw: (r, t) => {
								let a = Le(r, t), n = new Float32Array(16);
								return n.set(e.HEAPF32.subarray(a / 4, 16 + a / 4)), a = n, a;
							},
							world_tracker_create: (e) => Fe(e),
							world_tracker_destroy: () => {
								Me();
							},
							world_tracker_enabled: (e) => {
								let r = Se(e);
								return r = 1 === r, r;
							},
							world_tracker_enabled_set: (e, r) => Pe(e, r ? 1 : 0),
							world_tracker_scale_mode: (e) => Ie(e),
							world_tracker_scale_mode_set: (e, r) => Oe(e, r),
							world_tracker_session_number: (e) => Ce(e),
							world_tracker_quality: (e) => De(e),
							world_tracker_horizontal_plane_detection_enabled: (e) => {
								let r = Be(e);
								return r = 1 === r, r;
							},
							world_tracker_horizontal_plane_detection_enabled_set: (e, r) => Ne(e, r ? 1 : 0),
							world_tracker_vertical_plane_detection_enabled: (e) => {
								let r = Ue(e);
								return r = 1 === r, r;
							},
							world_tracker_vertical_plane_detection_enabled_set: (e, r) => Ve(e, r ? 1 : 0),
							world_tracker_plane_anchor_count: (e) => Ge(e),
							world_tracker_plane_anchor_id: (e, r) => He(e, r),
							world_tracker_plane_anchor_pose_raw: (r, t) => {
								let a = Xe(r, t), n = new Float32Array(16);
								return n.set(e.HEAPF32.subarray(a / 4, 16 + a / 4)), a = n, a;
							},
							world_tracker_plane_anchor_status: (e, r) => We(e, r),
							world_tracker_plane_anchor_polygon_data_size: (e, r) => qe(e, r),
							world_tracker_plane_anchor_polygon_data: (r, t) => {
								let a = Ye(r, t), n = qe(r, t), i = new Float32Array(n);
								return i.set(e.HEAPF32.subarray(a / 4, n + a / 4)), a = i, a;
							},
							world_tracker_plane_anchor_polygon_version: (e, r) => je(e, r),
							world_tracker_plane_anchor_orientation: (e, r) => Ze(e, r),
							world_tracker_world_anchor_status: (e) => Ke(e),
							world_tracker_world_anchor_id: (e) => $e(e),
							world_tracker_world_anchor_pose_raw: (r) => {
								let t = Qe(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							world_tracker_ground_anchor_id: (e) => Je(e),
							world_tracker_ground_anchor_status: (e) => er(e),
							world_tracker_ground_anchor_pose_raw: (r) => {
								let t = rr(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							world_tracker_reset: (e) => tr(e),
							world_tracker_tracks_data_enabled: (e) => {
								let r = ar(e);
								return r = 1 === r, r;
							},
							world_tracker_tracks_data_enabled_set: (e, r) => nr(e, r ? 1 : 0),
							world_tracker_tracks_data_size: (e) => ir(e),
							world_tracker_tracks_data: (r) => {
								let t = or(r), a = ir(r), n = new Float32Array(a);
								return n.set(e.HEAPF32.subarray(t / 4, a + t / 4)), t = n, t;
							},
							world_tracker_tracks_type_data_size: (e) => sr(e),
							world_tracker_tracks_type_data: (r) => {
								let t = _r(r), a = sr(r), n = new Uint8Array(a);
								return n.set(e.HEAPU8.subarray(t, a + t)), t = n, t;
							},
							world_tracker_projections_data_enabled: (e) => {
								let r = cr(e);
								return r = 1 === r, r;
							},
							world_tracker_projections_data_enabled_set: (e, r) => lr(e, r ? 1 : 0),
							world_tracker_projections_data_size: (e) => pr(e),
							world_tracker_projections_data: (r) => {
								let t = ur(r), a = pr(r), n = new Float32Array(a);
								return n.set(e.HEAPF32.subarray(t / 4, a + t / 4)), t = n, t;
							},
							custom_anchor_create: (e, r, t) => dr(e, r, t),
							custom_anchor_destroy: () => {
								mr();
							},
							custom_anchor_status: (e) => fr(e),
							custom_anchor_pose_version: (e) => hr(e),
							custom_anchor_pose_raw: (r) => {
								let t = br(r), a = new Float32Array(16);
								return a.set(e.HEAPF32.subarray(t / 4, 16 + t / 4)), t = a, t;
							},
							custom_anchor_pose_set_from_camera_offset_raw: (e, r, t, a, n) => wr(e, r, t, a, n),
							custom_anchor_pose_set_from_anchor_offset: (e, r, t, a, n, i) => gr(e, r, t, a, n, i),
							custom_anchor_pose_set: (r, t) => {
								let a = Tr(0, t.byteLength);
								return e.HEAPF32.set(t, a / 4), yr(r, a);
							},
							custom_anchor_pose_set_with_parent: (r, t, a) => {
								let n = Tr(0, t.byteLength);
								return e.HEAPF32.set(t, n / 4), vr(r, n, a);
							},
							d3_tracker_create: (e) => kr(e),
							d3_tracker_destroy: () => {
								Er();
							}
						};
					}(a);
					const r = function(e) {
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
					}(a), n = t > 0 ? function(e) {
						return {
							data_download_clear: e.cwrap("data_download_clear", null, []),
							data_download_size: e.cwrap("data_download_size", "number", []),
							data_download: e.cwrap("data_download", "number", []),
							data_should_record_set: e.cwrap("data_should_record_set", null, ["number"])
						};
					}(a) : void 0;
					null == n || n.data_should_record_set(t);
					let i = new A(e, (e, r) => {
						Q.postOutgoingMessage({
							p: e,
							t: "zappar",
							d: r
						}, [r]);
					});
					Q.postOutgoingMessage("loaded", []), Q.onIncomingMessage.bind((t) => {
						var o, s, _;
						switch (t.t) {
							case "zappar":
								i.processBuffer(t.d), Q.postOutgoingMessage({
									t: "buf",
									d: t.d
								}, [t.d]);
								break;
							case "buf":
								null === (o = i.serializersByPipelineId.get(t.p)) || void 0 === o || o.bufferReturn(t.d);
								break;
							case "cameraFrameC2S": {
								let o, s = t, _ = i._pipeline_by_instance.get(s.p);
								_ && (e.pipeline_camera_frame_submit(_, s.d, s.width, s.height, s.token, s.c2d, s.cm, s.userFacing, s.captureTime), e.pipeline_frame_update(_), o = e.pipeline_camera_frame_device_attitude(_), i.exploreState(), de(a, r), n && me(a, n));
								let c = {
									token: s.token,
									d: s.d,
									p: s.p,
									t: "cameraFrameRecycleS2C",
									att: o
								};
								Q.postOutgoingMessage(c, [s.d]);
								break;
							}
							case "rawenabled":
								ee = t.v;
								break;
							case "rawrequest": {
								const e = t, r = re.get(e.p), a = {
									t: "raw",
									token: e.token,
									p: e.p,
									data: r && null !== (_ = null === (s = r.ready.find((r) => r.token === e.token)) || void 0 === s ? void 0 : s.data) && void 0 !== _ ? _ : null
								};
								Q.postOutgoingMessage(a, []);
								break;
							}
							case "cameraProfileC2S": {
								let e = t;
								te.set(e.source, e.p);
								break;
							}
							case "streamC2S": {
								let o = t;
								(function(e, r, t, a, n, i, o, s, _) {
									return Z(this, void 0, void 0, function* () {
										for (;;) {
											let l;
											try {
												l = yield t.getReader();
											} catch (c) {
												yield pe(1e3);
												continue;
											}
											try {
												yield le(e, r, l, a, n, i, o, s, _);
												return;
											} catch (c) {}
											yield pe(1e3);
											return;
										}
									});
								})(a, e, o.s, o.p, o.userFacing, i, o.source, r, n).then(() => {
									let e = {
										t: "streamEndedS2C",
										p: o.p,
										source: o.source
									};
									Q.postOutgoingMessage(e, []);
								}).catch((e) => {});
								break;
							}
							case "cameraToScreenC2S":
								J = t.r;
								break;
							case "imageBitmapC2S":
								j(t, e, i, Q);
								break;
							case "sensorDataC2S": {
								const r = t, a = i._pipeline_by_instance.get(r.p);
								if (!a) break;
								switch (r.sensor) {
									case "accel":
										e.pipeline_motion_accelerometer_submit(a, r.timestamp, r.x, r.y, r.z);
										break;
									case "accel_w_gravity_int":
										e.pipeline_motion_accelerometer_with_gravity_submit_int(a, r.timestamp, r.interval, r.x, r.y, r.z);
										break;
									case "accel_wo_gravity_int":
										e.pipeline_motion_accelerometer_without_gravity_submit_int(a, r.timestamp, r.interval, r.x, r.y, r.z);
										break;
									case "attitude_int":
										e.pipeline_motion_attitude_submit_int(a, r.timestamp, r.interval, r.x, r.y, r.z);
										break;
									case "attitude":
										e.pipeline_motion_attitude_submit(a, r.timestamp, r.x, r.y, r.z);
										break;
									case "rotation_rate_int":
										e.pipeline_motion_rotation_rate_submit_int(a, r.timestamp, r.interval, r.x, r.y, r.z);
										break;
									case "rotation_rate":
										e.pipeline_motion_rotation_rate_submit(a, r.timestamp, r.x, r.y, r.z);
										break;
									case "relative_orientation": e.pipeline_motion_relative_orientation_submit_int(a, r.timestamp, r.interval, r.x, r.y, r.z, r.w);
								}
								break;
							}
							case "attitudeMatrixC2S": {
								const r = t, a = i._pipeline_by_instance.get(r.p);
								if (!a) break;
								e.pipeline_motion_attitude_matrix_submit(a, r.m);
								break;
							}
						}
					});
				}
			});
		});
	}
	let ne = 0, ie = 0, oe = 1;
	function se(e) {
		return new Promise((r, t) => {
			const a = setTimeout(() => {
				t("Frame timeout");
			}, 2e3);
			e.read().then((e) => {
				clearTimeout(a), r(e);
			});
		});
	}
	const _e = R(), ce = new Float32Array([
		300,
		300,
		160,
		120,
		0,
		0
	]);
	function le(e, r, t, a, n, i, o, s, _) {
		var c, l;
		return Z(this, void 0, void 0, function* () {
			for (;;) {
				let u = yield se(t);
				if (u.done) return void (null === (c = u.value) || void 0 === c || c.close());
				let d = u.value, m = d.allocationSize();
				m > ie && (ne > 0 && e._free(ne), ne = e._malloc(m), ie = m), yield d.copyTo(e.HEAPU8.subarray(ne, ne + ie));
				let f = oe;
				oe++;
				const h = d.visibleRect.width, b = d.visibleRect.height;
				let w, g = h, v = b;
				switch (J) {
					case 270:
						w = new Float32Array([
							0,
							1,
							0,
							0,
							-1,
							0,
							0,
							0,
							0,
							0,
							1,
							0,
							1,
							0,
							0,
							1
						]), g = b, v = h;
						break;
					case 180:
						w = new Float32Array([
							-1,
							0,
							0,
							0,
							0,
							-1,
							0,
							0,
							0,
							0,
							1,
							0,
							1,
							1,
							0,
							1
						]);
						break;
					case 90:
						w = new Float32Array([
							0,
							-1,
							0,
							0,
							1,
							0,
							0,
							0,
							0,
							0,
							1,
							0,
							0,
							1,
							0,
							1
						]), g = b, v = h;
						break;
					default: w = new Float32Array([
						1,
						0,
						0,
						0,
						0,
						1,
						0,
						0,
						0,
						0,
						1,
						0,
						0,
						0,
						0,
						1
					]);
				}
				let k = !1;
				te.get(o) !== y.HIGH && (g /= 2, v /= 2, k = !0);
				let E = d.clone();
				n ? F(_e, [
					-1,
					1,
					-1
				]) : L(_e);
				let A = (n ? 300 : 240) * g / 320;
				ce[0] = A, ce[1] = A, ce[2] = .5 * g, ce[3] = .5 * v;
				const z = {
					token: f,
					d: E,
					p: a,
					t: "videoFrameS2C",
					userFacing: n,
					uvTransform: w,
					w: g,
					h: v,
					cameraToDevice: _e,
					cameraModel: ce,
					source: o
				};
				Q.postOutgoingMessage(z, [z.d, z.uvTransform.buffer]);
				const x = i._pipeline_by_instance.get(a);
				if (x) {
					try {
						r.pipeline_camera_frame_submit_raw_pointer(x, ne, m, ue(d.format), h, b, f, _e, J, ce, n, null !== (l = d.timestamp) && void 0 !== l ? l : -1, k), de(e, s), _ && me(e, _);
					} catch (p) {
						console.log("Exception during camera processing", p);
					}
					if (r.pipeline_frame_update(x), ee) {
						let t = re.get(a);
						if (t || (t = {
							available: [],
							ready: []
						}, re.set(a, t)), t.ready.length > 4) {
							const e = t.ready.splice(0, 1);
							for (const r of e) t.available.push(new Uint8Array(r.data.data));
						}
						const n = r.pipeline_camera_frame_data_raw_size(x);
						let i;
						for (; !i || i.byteLength < n;) t.available.length < 1 && t.available.push(new Uint8Array(n)), i = t.available.pop();
						const o = r.pipeline_camera_frame_data_raw(x);
						i.set(e.HEAPU8.subarray(o, o + n)), t.ready.push({
							token: f,
							data: {
								data: i,
								width: r.pipeline_camera_data_width(a),
								height: r.pipeline_camera_data_height(a)
							}
						});
					}
					i.exploreState();
				}
				d.close();
			}
		});
	}
	function pe(e) {
		return new Promise((r) => {
			setTimeout(r, e);
		});
	}
	function ue(e) {
		switch (e) {
			case "I420": return f.FRAME_PIXEL_FORMAT_I420;
			case "I420A": return f.FRAME_PIXEL_FORMAT_I420A;
			case "I422": return f.FRAME_PIXEL_FORMAT_I422;
			case "I444": return f.FRAME_PIXEL_FORMAT_I444;
			case "NV12": return f.FRAME_PIXEL_FORMAT_NV12;
			case "RGBA":
			case "RGBX": return f.FRAME_PIXEL_FORMAT_RGBA;
			case "BGRA":
			case "BGRX": return f.FRAME_PIXEL_FORMAT_BGRA;
		}
		return f.FRAME_PIXEL_FORMAT_Y;
	}
	function de(e, r) {
		const t = r.worker_message_send_count();
		if (0 !== t) {
			K && $ || (K = new MessageChannel(), K.port1.start(), K.port1.addEventListener("message", (t) => {
				if ("msgrec" !== t.data.t) return;
				const a = t.data.data, n = e._malloc(a.byteLength);
				e.HEAPU8.set(a, n), r.worker_message_receive(t.data.reference, a.byteLength, n, 0), e._free(n);
			}), $ = new MessageChannel(), $.port1.start(), $.port1.addEventListener("message", (t) => {
				if ("msgrec" !== t.data.t) return;
				const a = t.data.data, n = e._malloc(a.byteLength);
				e.HEAPU8.set(a, n), r.worker_message_receive(t.data.reference, a.byteLength, n, 1), e._free(n);
			}), Q.postOutgoingMessage({
				t: "setupCeresWorker",
				port0: K.port2,
				port1: $.port2
			}, [K.port2, $.port2]));
			for (let a = 0; a < t; a++) {
				const t = r.worker_message_send_reference(a), n = r.worker_message_send_data_size(a), i = r.worker_message_send_instance(a), o = r.worker_message_send_data(a), s = e.HEAPU8.slice(o, o + n);
				(0 === i ? K : $).port1.postMessage({
					t: "msgsend",
					data: s,
					reference: t,
					instance: i
				}, [s.buffer]);
			}
			r.worker_message_send_clear();
		}
	}
	function me(e, r) {
		const t = r.data_download_size();
		if (0 === t) return;
		const a = r.data_download(), n = e.HEAPU8.slice(a, a + t);
		Q.postOutgoingMessage({
			t: "_z_datadownload",
			data: n
		}, [n.buffer]), r.data_download_clear();
	}
	const fe = self;
	Q.onOutgoingMessage.bind(() => {
		let e = Q.getOutgoingMessages();
		for (let r of e) fe.postMessage(r.msg, r.transferables);
	});
	let he = (e) => {
		var r;
		e && e.data && "wasm" === e.data.t && (ae(location.href.startsWith("blob") ? e.data.url : new URL("/assets/zappar-cv-BTDyQUix.wasm", "" + self.location.href).toString(), e.data.module, null !== (r = e.data.shouldRecordData) && void 0 !== r ? r : 0), fe.removeEventListener("message", he));
	};
	fe.addEventListener("message", he), fe.addEventListener("message", (e) => {
		Q.postIncomingMessage(e.data);
	});
})();

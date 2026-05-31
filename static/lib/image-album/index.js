/**
 * 通用图片相册 / 灯箱（lightbox）
 *
 * 提供两个全局方法，供 Django 模板等页面复用：
 *   - openImageAlbum(startIndex, album)        点击缩略图全屏放大，可左右循环切换、缩放、拖拽、下载
 *   - downloadAlbumImageByIndex(index, album)  下载指定相册的第 index 张图片
 *
 * album 必须传入，结构为：
 *   { srcs: ['url1', 'url2', ...], names: ['下载文件名1.jpg', ...] }
 *   srcs 为图片地址数组，names 为对应下载文件名数组，下标一一对应。
 *
 * 用法示例（模板）：
 *   <script src="{% static 'lib/image-album/index.js' %}?v=1.0.0"></script>
 *   <img src="..." onclick="openImageAlbum(0, window.MY_ALBUM)">
 */
(function () {
    'use strict';

    if (window.openImageAlbum) return; // 避免重复加载时重复定义

    function downloadAlbumImageByIndex(index, album) {
        if (!album || !album.srcs || !album.names) return;
        var srcs = album.srcs;
        var names = album.names;
        if (index < 0 || index >= srcs.length) return;
        var url = srcs[index];
        var filename = names[index];
        fetch(url)
            .then(function (r) {
                if (!r.ok) throw new Error(r.statusText);
                return r.blob();
            })
            .then(function (blob) {
                var u = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = u;
                a.download = filename;
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(u);
            })
            .catch(function (err) {
                console.error('Album image download failed:', err);
            });
    }

    function openImageAlbum(startIndex, album) {
        if (!album || !album.srcs || !album.srcs.length) return;
        var srcs = album.srcs;
        var names = album.names;

        var idx = Math.max(0, Math.min(Number(startIndex) || 0, srcs.length - 1));
        var scale = 1;
        var tx = 0;
        var ty = 0;
        var dragging = false;
        var dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
        var touchSwipeStart = null;
        var lastPanTouch = null;

        var prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        var overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.88);display:flex;flex-direction:column;font-family:sans-serif;';

        function mkBtn(label, title) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = label;
            b.title = title || '';
            b.style.cssText = 'min-width:36px;height:36px;border:none;border-radius:4px;background:rgba(255,255,255,.15);color:#fff;font-size:18px;cursor:pointer;line-height:1;';
            b.onmouseenter = function () { b.style.background = 'rgba(255,255,255,.28)'; };
            b.onmouseleave = function () { b.style.background = 'rgba(255,255,255,.15)'; };
            return b;
        }

        var zoomOut = mkBtn('−', '缩小');
        var zoomIn = mkBtn('+', '放大');
        var resetBtn = mkBtn('1:1', '重置缩放');
        var closeBtnAlbum = mkBtn('×', '关闭');
        closeBtnAlbum.style.fontSize = '22px';

        var toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;justify-content:flex-end;align-items:center;gap:8px;padding:12px 16px;flex-shrink:0;width:100%;box-sizing:border-box;';

        var albumDownload = document.createElement('a');
        albumDownload.href = '#';
        albumDownload.textContent = '下载';
        albumDownload.title = '下载当前图片';
        albumDownload.style.cssText = 'margin-right:auto;color:rgba(255,255,255,.72);text-decoration:underline;font-size:15px;cursor:pointer;';
        albumDownload.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            downloadAlbumImageByIndex(idx, album);
        });

        var stage = document.createElement('div');
        stage.style.cssText = 'flex:1;position:relative;overflow:hidden;touch-action:none;';

        var prevArrow = document.createElement('span');
        prevArrow.type = 'button';
        prevArrow.innerHTML = '‹';
        prevArrow.title = '上一张';
        prevArrow.setAttribute('aria-label', '上一张');
        prevArrow.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);z-index:2;width:44px;height:44px;border:none;border-radius:50%;background:rgba(242,108,249,.7);color:#fff;font-size:44px;line-height:37px;cursor:pointer;text-align:center;';

        var nextArrow = document.createElement('span');
        nextArrow.type = 'button';
        nextArrow.innerHTML = '›';
        nextArrow.title = '下一张';
        nextArrow.setAttribute('aria-label', '下一张');
        nextArrow.style.cssText = 'position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:2;width:44px;height:44px;border:none;border-radius:50%;background:rgba(242,108,249,.7);color:#fff;font-size:44px;line-height:37px;cursor:pointer;text-align:center;';

        var imgWrap = document.createElement('div');
        imgWrap.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;';

        var img = document.createElement('img');
        img.style.cssText = 'max-width:90vw;max-height:85vh;object-fit:contain;user-select:none;-webkit-user-drag:none;';
        img.draggable = false;

        function applyTransform() {
            img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
        }

        function resetView() {
            scale = 1;
            tx = 0;
            ty = 0;
            touchSwipeStart = null;
            lastPanTouch = null;
            applyTransform();
        }

        function showCurrent() {
            resetView();
            img.src = srcs[idx];
            img.alt = '图片 ' + (idx + 1) + ' / ' + srcs.length;
        }

        function closeAlbum() {
            document.body.style.overflow = prevOverflow;
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('mouseup', endDrag);
        }

        function onKey(e) {
            if (e.key === 'Escape') closeAlbum();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === '+' || e.key === '=') doZoom(0.25);
            if (e.key === '-' || e.key === '_') doZoom(-0.25);
        }

        function goPrev() {
            idx = (idx - 1 + srcs.length) % srcs.length;
            showCurrent();
        }

        function goNext() {
            idx = (idx + 1) % srcs.length;
            showCurrent();
        }

        function doZoom(delta) {
            scale = Math.min(5, Math.max(0.25, scale + delta));
            applyTransform();
        }

        function endDrag() {
            dragging = false;
        }

        zoomIn.addEventListener('click', function () { doZoom(0.25); });
        zoomOut.addEventListener('click', function () { doZoom(-0.25); });
        resetBtn.addEventListener('click', resetView);
        closeBtnAlbum.addEventListener('click', closeAlbum);
        prevArrow.addEventListener('click', function (e) { e.stopPropagation(); goPrev(); });
        nextArrow.addEventListener('click', function (e) { e.stopPropagation(); goNext(); });

        img.addEventListener('wheel', function (e) {
            e.preventDefault();
            var d = e.deltaY > 0 ? -0.12 : 0.12;
            doZoom(d);
        }, { passive: false });

        img.addEventListener('dblclick', function (e) {
            e.preventDefault();
            resetView();
        });

        stage.addEventListener('mousedown', function (e) {
            if (scale <= 1) return;
            if (e.button !== 0) return;
            dragging = true;
            dragStart = { x: e.clientX, y: e.clientY, tx: tx, ty: ty };
            e.preventDefault();
        });

        window.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            tx = dragStart.tx + (e.clientX - dragStart.x);
            ty = dragStart.ty + (e.clientY - dragStart.y);
            applyTransform();
        });

        window.addEventListener('mouseup', endDrag);

        stage.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) return;
            var t = e.touches[0];
            touchSwipeStart = { x: t.clientX, y: t.clientY };
            if (scale > 1) {
                lastPanTouch = { x: t.clientX, y: t.clientY };
            }
        }, { passive: true });

        stage.addEventListener('touchmove', function (e) {
            if (scale <= 1 || e.touches.length !== 1 || !lastPanTouch) return;
            e.preventDefault();
            var t = e.touches[0];
            tx += t.clientX - lastPanTouch.x;
            ty += t.clientY - lastPanTouch.y;
            lastPanTouch = { x: t.clientX, y: t.clientY };
            applyTransform();
        }, { passive: false });

        stage.addEventListener('touchend', function (e) {
            if (scale > 1) {
                touchSwipeStart = null;
                lastPanTouch = null;
                return;
            }
            if (!touchSwipeStart) return;
            var t = e.changedTouches[0];
            var dx = t.clientX - touchSwipeStart.x;
            var dy = t.clientY - touchSwipeStart.y;
            touchSwipeStart = null;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) goPrev();
                else goNext();
            }
        }, { passive: true });

        img.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        stage.addEventListener('click', function (e) {
            if (e.target === stage || e.target === imgWrap) closeAlbum();
        });

        toolbar.appendChild(albumDownload);
        toolbar.appendChild(zoomOut);
        toolbar.appendChild(zoomIn);
        toolbar.appendChild(resetBtn);
        toolbar.appendChild(closeBtnAlbum);
        imgWrap.appendChild(img);
        stage.appendChild(imgWrap);
        stage.appendChild(prevArrow);
        stage.appendChild(nextArrow);
        overlay.appendChild(toolbar);
        overlay.appendChild(stage);

        document.body.appendChild(overlay);
        document.addEventListener('keydown', onKey);
        showCurrent();
    }

    window.downloadAlbumImageByIndex = downloadAlbumImageByIndex;
    window.openImageAlbum = openImageAlbum;
})();

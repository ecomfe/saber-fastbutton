/**
 * @file FastButton
 * @author Firede(firede@firede.us)
 */

define(function () {

    /**
     * 点击破坏器
     * 用于阻止300ms延迟后的穿透点击
     *
     * @type {Object}
     */
    var clickbuster = {};

    /**
     * 记录点击坐标的数组
     *
     * @type {Array}
     */
    clickbuster.coordinates = [];

    /**
     * 空间阈值
     * 两次事件的坐标根据此范围定位
     *
     * @const
     * @type {number}
     */
    var SPACE_THRESHOLD = 30;

    /**
     * 拖动阈值
     * 用于区分手势是点击还是拖动
     *
     * @const
     * @type {number}
     */
    var DRAG_THRESHOLD = 10;

    /**
     * 时间阈值
     * 延迟不是精确的300ms，要多预留些时间容错
     *
     * @const
     * @type {number}
     */
    var TIME_THRESHOLD = 1000;

    /**
     * FastButton
     *
     * @constructor
     * @param {HTMLElement} element 目标元素
     * @param {Function} handler 处理函数
     */
    function FastButton(element, handler) {
        this.element = element;
        this.handler = handler;

        element.addEventListener('touchstart', this, false);
        element.addEventListener('click', this, false);
    }

    /**
     * 事件集中处理
     *
     * @param {Event} event 事件对象
     */
    FastButton.prototype.handleEvent = function (event) {
        switch (event.type) {
            case 'touchstart':
                this.onTouchStart(event);
                break;
            case 'touchmove':
                this.onTouchMove(event);
                break;
            case 'touchend':
                this.onClick(event);
                break;
            case 'click':
                this.onClick(event);
                break;
        }
    };

    /**
     * touchstart事件处理
     * 记录坐标并绑定后续的事件
     *
     * @param {Event} event 事件对象
     */
    FastButton.prototype.onTouchStart = function (event) {
        event.stopPropagation();

        this.element.addEventListener('touchend', this, false);
        document.body.addEventListener('touchmove', this, false);

        this.startX = event.touches[0].clientX;
        this.startY = event.touches[0].clientY;
    };

    /**
     * touchmove事件处理
     * 判断是点击还是拖动，若是拖动则取消后续的事件
     *
     * @param {Event} event 事件对象
     */
    FastButton.prototype.onTouchMove = function (event) {
        if (
            Math.abs(event.touches[0].clientX - this.startX) > DRAG_THRESHOLD
            || Math.abs(event.touches[0].clientY - this.startY) > DRAG_THRESHOLD
        ) {
            this.reset();
        }
    };

    /**
     * 点击事件
     *
     * @param {Event} event 事件对象
     */
    FastButton.prototype.onClick = function (event) {
        event.stopPropagation();
        this.reset();

        // 执行事件处理函数
        this.handler(event);

        // 将坐标传给点击破坏器
        if (event.type === 'touchend') {
            clickbuster.preventGhostClick(this.startX, this.startY);
        }
    };

    /**
     * 重置
     * 不是点击行为时，解绑后续的事件
     */
    FastButton.prototype.reset = function () {
        this.element.removeEventListener('touchend', this, false);
        document.body.removeEventListener('touchmove', this, false);
    };

    /**
     * 销毁事件
     */
    FastButton.prototype.dispose = function () {
        this.reset();
        this.element.removeEventListener('touchstart', this, false);
        this.element.removeEventListener('click', this, false);
    };

    /**
     * 屏蔽穿透点击
     *
     * @param {number} x x坐标
     * @param {number} y y坐标
     */
    clickbuster.preventGhostClick = function (x, y) {
        clickbuster.coordinates.push(x, y);
        window.setTimeout(clickbuster.pop, TIME_THRESHOLD);
    };

    /**
     * 干掉失效坐标
     */
    clickbuster.pop = function () {
        clickbuster.coordinates.splice(0, 2);
    };

    /**
     * 穿透点击事件处理
     * 通过捕获方式调用
     *
     * @param {Event} event 事件对象
     */
    clickbuster.onClick = function (event) {
        for (var i = 0; i < clickbuster.coordinates.length; i += 2) {
            var x = clickbuster.coordinates[i];
            var y = clickbuster.coordinates[i + 1];

            if (
                Math.abs(event.clientX - x) < SPACE_THRESHOLD
                && Math.abs(event.clientY - y) < SPACE_THRESHOLD
            ) {
                event.stopPropagation();
                event.preventDefault();
            }
        }
    };

    // 默认捕获click时间，用于破坏穿透点击
    document.addEventListener('click', clickbuster.onClick, true);

    return FastButton;

});

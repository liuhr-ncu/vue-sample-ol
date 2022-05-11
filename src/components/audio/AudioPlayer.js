/**
 * 音频资源播放器
 */
class AudioPlayer {

    /**
     *
     * @param url
     */
    constructor(url) {
        let context = AudioPlayer._createAudioContext();
        this._context = context;
        this._source = null;
        AudioPlayer._loadBuffer(context, url).then(buffer => {
            this._buffer = buffer;
        });
    }

    /**
     * 播放
     * @param loop
     * @param onended
     */
    start(loop, onended) {
        let {_context, _buffer} = this;
        let source = AudioPlayer._createBufferSource(_context, _buffer);
        source.loop = loop;
        source.onended = onended;
        source.start(0);
        this._source = source;
    }

    /**
     * 停止
     */
    stop() {
        let {_source} = this;
        _source && _source.stop(0);
    }

    /**
     *
     * @returns {AudioContext}
     * @private
     */
    static _createAudioContext() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        return new window.AudioContext();
    }

    /**
     *
     * @param context
     * @param url
     * @returns {Promise<unknown>}
     * @private
     */
    static _loadBuffer(context, url) {
        return new Promise((resolve, reject) => {
            if (!context) {
                reject('not support AudioContext');
                return;
            }
            let request = new XMLHttpRequest();
            request.open('GET', url,  true);
            request.responseType = 'arraybuffer';
            request.onload = function () {
                context.decodeAudioData(request.response, function (buffer) {
                    resolve(buffer);
                }, function (e) {
                    reject(e);
                });
            };
            request.send();
        });
    }

    /**
     *
     * @param context
     * @param buffer
     * @returns {AudioBufferSourceNode}
     * @private
     */
    static _createBufferSource(context, buffer) {
        if (context.state !== 'running') {
            console.log('重启AudioContext');
            context.resume();
        }
        let source = context.createBufferSource();
        source.buffer = buffer;
        source.connect(context.destination);
        return source;
    }

}

export default AudioPlayer

declare module 'jsvectormap' {
    interface JsVectorMapOptions {
        [key: string]: unknown;
    }

    class JsVectorMap {
        constructor(options: JsVectorMapOptions);
    }

    export default JsVectorMap;
}

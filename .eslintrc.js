module.exports = {
    "extends": [
        //"standard",
        "plugin:@typescript-eslint/recommended"
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parser" : "@typescript-eslint/parser",
    "parserOptions": {
        "project" : "./tsconfig.json",
        
    },
    
};
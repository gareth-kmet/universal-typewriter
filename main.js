const game = window.open("paperclips/index2.html", "game");

/**
 * @type {HTMLInputElement[]}
 */
var inputs = []
/**
 * @type {HTMLLabelElement[][]}
 */
var labels = [];

var codeDisplays = []
const MAX_HISTORY = 6;
const hist = [];
var currentHist = -1;
var numberOfEvals = 0;

var gameComplete = false;

var objects = [game];

const inputDiv = document.getElementById("input");
const outputDiv = document.getElementById("output");
const validation = document.getElementById("validation");


function runCode(){
    if(currentValue().length == 0 && !typeof currentObj() == "function"){
        toPreviousInputField();
    }
    const input = getStringCode();
    const outFunct = evaluate();
    var val;
    try{
        val = outFunct();
    }catch(error){
        val = error;
    }

    console.log(getStringCode(), val)

    console.log(input)

    displayOutput(input, val);
    
    if(input == "isGameWon()" && game.isGameWon()){
        console.log("You win")
        gameComplete = true;
        currentInput().blur()
        currentInput().hidden = true
        document.getElementById("win").hidden = false
        return true
        
    }
    newInput();
    
    return false;
}

function saveVariable(){
    this.disabled = true;
    const id = $(this).data("eval-num");
    const data = $(this).data("eval-result");
    const context= $(this).data("eval-context");
    this.innerText = `Stored as temp${id}`
    if(typeof data == "function"){
        game[`temp${id}`]= () => data.apply(context);   
    }else{ 
        game[`temp${id}`]=data;
    }
}

function displayOutput(input, val){
    const output = prettyPrint(val,0);
    const div = document.createElement("div");
    const node = document.createElement("pre");
    const code = document.createElement("code");
    const text = document.createTextNode(
        `In:  ${input};\nOut: ${output}`
    );
    code.appendChild(text);
    node.appendChild(code);
    hljs.highlightElement(node);

    if(typeof val != "function"){
        const btn = document.createElement("button");
        const txt = document.createTextNode("Store as global");
        btn.appendChild(txt);
        $(btn).data("eval-num", numberOfEvals++);
        $(btn).data("eval-context", objects[objects.length-1]);
        $(btn).data("eval-result", val);
        btn.classList.add("saveBtn");
        btn.onclick = saveVariable;

        div.appendChild(btn);
    }
    
    div.appendChild(node);

    outputDiv.insertBefore(div, outputDiv.childNodes[1]);
    codeDisplays.unshift(div);
    if(codeDisplays.length > MAX_HISTORY){
        outputDiv.removeChild(codeDisplays.pop());
    }
}

function evaluate(){
    var value;
    if(hasNext()){
        value = () => nextObj();
    }else{
        const obj = currentObj();
        if(typeof obj == "function"){
            value = () => obj.apply(objects[objects.length - 2]);
        }else{
            value = () => obj;
        }
    }
    return value;
}

function prettyPrint(obj, depth){
    var t=obj;
    if(Array.isArray(obj) && depth >= 1){
        t = `Array(${obj.length})`;
    }else if(Array.isArray(obj) && depth <= 0){
        var a = [];
        for(const o of obj){
            a.push(prettyPrint(o, depth+1));
        }
        t = `[${a.join(',')}]`;
    }else if(typeof obj == "function" && depth >= 1){
        t = `\u{1D453} ()`;
    }else if(typeof obj == "string"){
        t = `"${obj}"`;
    }else if(typeof obj == "object" && obj){
        t = `[object ${obj.constructor.name}]`
    }
    return t;
}



function getStringCode(){
    var s = "";
    for(const i of inputDiv.children){
        if(i instanceof HTMLLabelElement){
            s += i.innerText;
        }else if(i instanceof HTMLInputElement){
            s += i.value;
        }
    }
    return s;
}

function moveInput(){

}

function onStart(){

}

function calculateOptions(){

}

function currentInput(){
    if(inputs.length > 0){
        return inputs[inputs.length-1]
    }else{
        return null;
    }
}

function currentObj(){
    if(inputs.length > 0){
        return objects[inputs.length-1]
    }else{
        return null;
    }
}

function currentType(){
    if(inputs.length > 0){
        return inputs[inputs.length-1].type;
    }else{
        return null;
    }
}

function currentValue(){
    return currentInput()?.value;
}

function nextObj(){
    if(typeof currentObj() == "object"){
        return currentObj()[currentValue()];
    }else{
        return undefined;
    }
}

const nextKeys = [190,219,57,9]//. [ ( \t
const key_dot = 190;
const submitKeys = [13,186]//\n ;
const functSubmitKeys = [48];

function hasNext(){
    const obj = currentObj();
    const type = typeof obj;
    if(type == "object" && obj){
        return true;
    }
    if(type == "string"){
        return true;
    }
    return false;
}

function dealWithInvalidChar(event){
    var key = event.keyCode || event.charCode;
    var obj = currentObj();
    const type = typeof obj;

    if(hasNext()){
        const next = nextObj();
        const nextType = typeof next;
        if(next === null || next == undefined){
            if(nextKeys.includes(key)){
                validation.innerText = `Uncaught TypeError: Cannot read properties of ${next} (reading '${currentValue()}')`;
                return true;
            }
        }else if(nextType != "function" && nextType != "object" && nextType != "string"){
            if(nextKeys.includes(key)){
                return true;
            }
        }
    }else if(typeof obj == "function"){
        if(nextKeys.includes(key)){
            validation.innerText = `Uncaught TypeError: Cannot read properties of ${prettyPrint(obj, 1)}`;
            return true;
        }
        validation.innerText = `Uncaught IllegalArgumentException: Cannot pass arguments to ${prettyPrint(obj, 1)}`
        return true;
    }else{
        validation.innerText = `Uncaught TypeError: Cannot read properties of ${prettyPrint(obj, 1)}`
        return true;
    }
    return false;
}

const MIN_INPUT_SIZE = 5;

function onInput(){
    currentInput().size = Math.max(currentValue().length,MIN_INPUT_SIZE);
}

function onKeyDown(event){
    if(gameComplete) return true;
    validation.innerText = "";
    var key = event.keyCode || event.charCode;
    if(submitKeys.includes(key)){ // enter ;
        runCode();
        return false;
    }
    if(event.ctrlKey){
        if(key == 107 || key == 187){//+
            fromHist(1);
            return false;
        }else if(key == 109 || key == 189){//-
            fromHist(-1);
            return false;
        }
    }
    
    if(typeof currentObj() == "function" && functSubmitKeys.includes(key)){
        runCode();
        return false;
    }
    if(key == 9 && event.shiftKey){
        //tab and shift pressed
        toPreviousInputField();
        return false;
    }
    if(key == 8 && currentInput().value.length <= 0 && inputs.length > 1){
        //backspace pressed and no text, go to previous input
        toPreviousInputField();
        return false;
    }
    if(dealWithInvalidChar(event)){
        return false;
    }
    if(nextKeys.includes(key)){
        toNext(key);
        return false;
    }
    
    return true;
}

const TYPE_ENUM = {
    INVALID: 0,
    NULL: 1,
    VALUE: 2,
    ARRAY: 3,
    FUNCTION: 4,
    OBJECT: 5
}


function getPropertyTypeOfProp(obj, prop){
    const o = obj[prop];
    if(o == obj){
        return TYPE_ENUM.INVALID;
    }
    if(o == objects[0]){
        return TYPE_ENUM.INVALID;
    }
    if(o == null || o == undefined) return TYPE_ENUM.NULL;
    if(Array.isArray(o)) return TYPE_ENUM.ARRAY;
    if(typeof o == "object") return TYPE_ENUM.OBJECT;
    if(typeof o == "function") {
        if(inputs.length > 1){
            if(obj instanceof game.HTMLButtonElement && prop == "click"){
                return TYPE_ENUM.FUNCTION;
            }
            return TYPE_ENUM.INVALID;
        }
        return TYPE_ENUM.FUNCTION;
    }
    return TYPE_ENUM.VALUE;
}

function getValidOptions(){
    const obj = currentObj();
    var options = {
        all:[]
    }
    options[TYPE_ENUM.ARRAY] = [];
    options[TYPE_ENUM.OBJECT] = [];
    options[TYPE_ENUM.FUNCTION] = [];
    options[TYPE_ENUM.VALUE] = [];
    options[TYPE_ENUM.NULL] = [];

    if(typeof obj == "object" && obj){
        for(const prop in obj){
            var type = getPropertyTypeOfProp(obj, prop);
            if(type){
                options[type].push(prop);
                options.all.push(prop);
            }
        }
    }
    options[TYPE_ENUM.ARRAY].sort();
    options[TYPE_ENUM.OBJECT].sort();
    options[TYPE_ENUM.FUNCTION].sort();
    options[TYPE_ENUM.VALUE].sort();
    options[TYPE_ENUM.NULL].sort();
    options.all.sort();
    return options;
}

function setValidOptions(){
    var options = getValidOptions();
    const node = currentInput();
    var datalist = document.createElement("datalist");
    datalist.id = `${node.id}list`
    for(const i of options.all){
        var o = document.createElement("option");
        o.value = i;
        var t = prettyPrint(currentObj()[i],1);
        if(options[TYPE_ENUM.ARRAY].includes(i)){
            o.classList.add("input-array");
        }else if(options[TYPE_ENUM.FUNCTION].includes(i)){
            o.classList.add("input-function");
        }else if(options[TYPE_ENUM.VALUE].includes(i)){
            o.classList.add("input-value");
        }else if(options[TYPE_ENUM.OBJECT].includes(i)){
            o.classList.add("input-object");
        }else if(options[TYPE_ENUM.NULL].includes(i)){
            o.classList.add("input-null");
        }else{
            o.classList.add("input-unknown");
        }
        o.appendChild(document.createTextNode(t))
        datalist.appendChild(o);
    }
    node.appendChild(datalist);
    node.setAttribute("list", `${node.id}list`)
}

function toNext(key){
    var type = "text"
    var isFunct = false;
    if(key != 0){
        const obj = nextObj();
        const objType = typeof obj;
        if(Array.isArray(obj) && key != key_dot){
            type = "number";
        }else if(objType == "object" || objType == "string"){
            type = "text";
        }else if(objType == "function"){
            type = "text";
            isFunct = true;
        }
    }

    addInput(key, type, isFunct);
}

function addInput(key, type, isFunct){
    /**
     * @type {HTMLLabelElement[]}
     */
    const blbls = [];
    /**
     * @type {HTMLLabelElement[]}
     */
    const albls = [];
    if(key == 190 && !isFunct){ //.
        const lbl = document.createElement("label");
        lbl.appendChild(document.createTextNode("."))
        blbls.push(lbl);
    }else if((key == 219 || key == 9) && type == "text" && !isFunct){ // '[' or \t
        const lbl = document.createElement("label");
        lbl.appendChild(document.createTextNode("[\""))
        blbls.push(lbl);
        const lbl2 = document.createElement("label");
        lbl2.appendChild(document.createTextNode("\"]"))
        albls.push(lbl2);
    }else if((key == 219 || key == 9) && type == "number" && !isFunct){ //[ or \t
        const lbl = document.createElement("label");
        lbl.appendChild(document.createTextNode("["))
        blbls.push(lbl);
        const lbl2 = document.createElement("label");
        lbl2.appendChild(document.createTextNode("]"))
        albls.push(lbl2);
    }else if(key == 57 || isFunct){ //(
        const lbl = document.createElement("label");
        lbl.appendChild(document.createTextNode("("))
        blbls.push(lbl);
        const lbl2 = document.createElement("label");
        lbl2.appendChild(document.createTextNode(")"))
        albls.push(lbl2);
    }

    blbls.forEach(l => {
        l.classList.add("input-label");
        inputDiv.appendChild(l);
    });
    toNextInputField(type);
    albls.forEach(l => {
        l.classList.add("input-label");
        inputDiv.appendChild(l);
    });
    labels.push([albls,blbls]);
}

function toNextInputField(type){
    const node = document.createElement("input");
    node.type = type;
    node.id = `i${inputs.length}`;
    node.name = `i${inputs.length}`
    node.autocomplete = "off";
    node.classList.add("input-field", "input-active");
    node.onkeydown = onKeyDown;
    node.oninput = onInput;
    node.size = MIN_INPUT_SIZE;
    if(inputs.length == 0){
        objects.push(game);
    }else{
        objects.push(nextObj());
    }
    if(inputs.length > 0){
        const previous = inputs[inputs.length-1]
        previous.disabled = true;
        previous.onkeydown = null;
        previous.oninput = null;
        previous.classList.remove("input-active");
        previous.classList.add("input-inaction");
    }
    inputDiv.appendChild(node);
    inputs.push(node);
    setValidOptions();
    node.focus();
}

function toPreviousInputField(){
    if(inputs.length <= 1){
        return;
    }
    labels[inputs.length-1].forEach(arr => arr.forEach(lbl => inputDiv.removeChild(lbl)));
    labels.pop();
    const current = currentInput();
    inputDiv.removeChild(current);
    current.onkeydown = null;
    current.oninput = null;
    current.classList.remove("input-active");
    inputs.pop();
    const prev = currentInput();
    prev.classList.remove("input-inactive");
    prev.classList.add("input-active");
    prev.disabled = false;
    prev.onkeydown = onKeyDown;
    current.oninput = onInput;
    prev.focus();
    objects.pop();
}

function clear(){
    inputs.forEach(i => inputDiv.removeChild(i))
    inputs = [];
    labels.forEach(l => l.forEach(arr => arr.forEach(lbl => inputDiv.removeChild(lbl))))
    labels = [];
    objects = [];
}

function remember(){
    if(inputs.length == 0) return;
    const h = {
        lbls: labels,
        ins: inputs,
        objs: objects
    }
    hist.unshift(h);
    if(hist.length > MAX_HISTORY){
        hist.pop();
    }
}

function fromHist(move){
    if(currentHist + move >= hist.length || currentHist + move < 0){
        //validation.innerText = `Uncaught ArrayIndexOutOfboundsException: Index ${Math.max(currentHist+move,-1)} is out of bounds for length ${hist.length}. Note the history can only store up to ${MAX_HISTORY} calls`
        return false;
    }
    currentHist += move;
    set(hist[currentHist]);
}

function set({ins, lbls, objs}){
    clear();
    inputs = ins;
    labels = lbls;
    objects = objs;
    for(let i = 0; i < inputs.length; i++){
        labels[i][1].forEach(b => inputDiv.appendChild(b));
        inputDiv.appendChild(inputs[i]);
        labels[i][0].forEach(b => inputDiv.appendChild(b));
    }
    currentInput().focus();
}

function newInput(){
    remember();
    clear()
    toNext(0);
    currentHist = -1;
}

function load(){
    game.isGameWon = () => game.clips == 3e+55
    newInput();
    setupSources('paperclips/main.js', "source-main")
    setupSources('paperclips/combat.js', "source-combat")
    setupSources('paperclips/projects.js', "source-projects")
    setupSources('paperclips/globals.js', "source-globals")
}

function viewSource(id){
    const div = document.getElementById(id);
    div.classList.toggle("source-hide");
    document.getElementById(`${id}-btn`).classList.toggle("source-hide-btn");
}

function setupSources(source, id){
    var xhr = new XMLHttpRequest;
    xhr.open('GET', source, true);
    xhr.onload = function (){
        const node = document.createElement("pre");
        const code = document.createElement("code");
        const text = document.createTextNode(xhr.responseText);
        code.appendChild(text);
        node.appendChild(code);
        hljs.highlightElement(node);
        document.getElementById(id).appendChild(node);
    };
    xhr.send(null);

}

window.onload = load;
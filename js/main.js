

document.addEventListener("DOMContentLoaded", function() {
    let input = document.getElementById("input");
    let outputElement = document.getElementById("evaluation-history");

    let form = document.getElementById("form");
    let evalButton = document.getElementById("evaluate");
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        evalWithTableDriven(input.value, outputElement);
    });

    evalButton.addEventListener('click', function(e) {
        e.preventDefault();
        evalText(input.value, outputElement);
    })

});

function evalWithShuntingYard(text, outputElement) {
        let result = evalPostfix(ShuntingYard(text));
        appendResult(outputElement, text + " = " + result);
}

function evalWithTableDriven(text, outputElement) {
    let result = evalTableDriven(text);
    appendResult(outputElement, text + " = " + result);
}

function appendResult(outputElement, outputText) {
    let li = document.createElement("li");
    let textElement = document.createTextNode(outputText);
    li.appendChild(textElement);
    outputElement.appendChild(li);
}
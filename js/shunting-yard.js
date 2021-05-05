/* Utility */

function topOf(stack) {
    return stack[stack.length - 1];
}

function isDigit(character) {
    return character.length == 1 && '0123456789'.includes(character);
}

function applyOperator(operator) {
    switch(operator) {
        case '+': return (a, b) => a + b;
        case '-': return (a, b) => a - b;
        case '*': return (a, b) => a * b;
        case '/': return (a, b) => a / b;
        default:
            console.error('Unexpected operator ' + operator);
    }
}

/*
    Shunting-Yard algorithm
    Source: https://brilliant.org/wiki/shunting-yard-algorithm/
*/

function ShuntingYard(text) {
    let operators = [],
        expression = [],
        cursor = 0;

    while(cursor < text.length) {
        switch(text[cursor]) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                // accumulate a sequence of digits into a string
                let digits = text[cursor];
                while(cursor + 1 < text.length && isDigit(text[cursor+1])) {
                    digits += text[cursor+1];
                    cursor += 1;
                }
                expression.push(digits);
                break;
            case '+':
            case '-':
            case '*':
            case '/':
                while(operators.length > 0 && greaterPrecedence(topOf(operators), text[cursor])) {
                    expression.push(operators.pop());
                }
                operators.push(text[cursor]);
                break;
            case '(':
                operators.push('(');
                break;
            case ')':
                while(topOf(operators) !== '(') {
                    expression.push(operators.pop());
                }
                operators.pop();
                break;
            default:
                console.error('Unexpected character ' + text[cursor]);
                break;
        }
        cursor += 1;
    }

    return expression.concat(operators.reverse());
}

function greaterPrecedence(a, b) {
    let precedence = [['+', '-'], ['*', '/']];
    let precedenceMap = mapPrecedence(precedence);
    return precedenceMap[a] >= precedenceMap[b];
}

function mapPrecedence(precedence) {
    let map = {};
    let operator_level = 0;
    precedence.forEach(level => {
        level.forEach(operator => {
            map[operator] = operator_level;
        });
        operator_level += 1;
    })
    return map;
}

function evalPostfix(postfix) {
    let stack = [];
    for(let i=0; i<postfix.length; i++) {
        if(isDigit(postfix[i][0])) {
            stack.push(postfix[i]);
        } else {
            let y = parseFloat(stack.pop()),
                x = parseFloat(stack.pop()),
                result = applyOperator(postfix[i])(x, y);
            stack.push(result);
            //console.log(x, postfix[i], y, '=', result);
        }
    }
    return stack[0];
}

// Compare results
function test() {
    console.log(evalPostfix(ShuntingYard('1-3+54-5+3*(10)')) === 1-3+54-5+3*(10));
    console.log(evalPostfix(ShuntingYard('(3-2)+5')) === (3-2)+5);
    console.log(evalPostfix(ShuntingYard('3-(2+5)')) === 3-(2+5));
    console.log(evalPostfix(ShuntingYard('6*(234-6)')) === 6*(234-6));
    console.log(evalPostfix(ShuntingYard('34-5*2+6*(234-6)')) === 34-5*2+6*(234-6));
    console.log(evalPostfix(ShuntingYard('(3+5)*7-5')) === (3+5)*7-5);
    console.log(evalPostfix(ShuntingYard('34+5*2+5')) === 34+5*2+5);
    console.log(evalPostfix(ShuntingYard('8+4*2*3+5*1*0')) === 8+4*2*3+5*1*0);
    console.log(evalPostfix(ShuntingYard('1+3-4')) === 1+3-4);
    console.log(evalPostfix(ShuntingYard('2*11+3*33')) === 2*11+3*33);
    console.log(evalPostfix(ShuntingYard('2*3*22+5*10+7+6+66+666')) === 2*3*22+5*10+7+6+66+666);
}

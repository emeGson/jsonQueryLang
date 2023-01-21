# Examples
&root                                   Should return entire inputed object
&root.thing                             Should only return the thing property of the root object if root is a list throw
&root.*.thing                           the property thing from all objects in list
&var = &root.thing                      allocate variable var with result of expression
&root.*.thing.$sum                      sum all thing numbers
&root.*.$*(price, quantity)             return the numbers that are the result of multiplying price and quanatity
&root.*.$filter($equal(price,20))       only keep the objects with a price equal to 20

# Grammar
boolean = 'true' | 'false'
atom = boolean | string | number
argument = atom | expression
function = '$' identifier ('(' (argument (',' argument)* )? ')')?
expression = identifier ('.' (identifier | function))*
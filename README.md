# grunt-h2cpp-parser

Grunt task to parse .h files and generate .cpp files then needed

## Example:

### Input (no .cpp file):
```cpp
class className2 {
		//@implement
		className2() {
			className2::instance = this;
		}

		//@implement
		//@include "test.h"
		className2Process* getProcess(String name)
		{
			int pos = this->findProcess(name);
			if (pos > -1) {
				return this->processList.get(pos);
			}
			return NULL;
		}
};
```

### Output:

#### .h
```cpp
class className2 {
    className2();

    className2Process* getProcess(String name);
};
```

#### .cpp
```cpp
#include "className2.h"
#include "test.h"

className2::className2() {
	className2::instance = this;
}

className2::className2Process* getProcess(String name) 
{
	int pos = this->findProcess(name);
	if (pos > -1) {
		return this->processList.get(pos);
	}
	return NULL;
}
```

## Syntax

### //@implement

Marks next method body to be moved into .cpp-file. If correspond file ("file.cpp" for "file.h" in the same directory) is not exists, it will be created. Else, moved contents appends.

### //@include (file)

Marks next method body requires specified file. (file) will be added to .cpp file
```
//@include "file.h"
//@include "file2.h"
//@include <String.h>
```

## Description

This module created for lazy cpp-programmers like me, to place as much as possible to .h file. Enjoy if like))

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('grunt-h2cpp-parser', 'parse .h files and auto-generate .cpp files then needed', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      skipRegex: null,
      filePrefix: 'pre_',
      filePostfix: '_post'
    });
	
	var path = require('path');
	
	function fileToArr(filepath) {
		var fileStr = grunt.util.normalizelf(grunt.file.read(filepath));
        return fileStr.split(grunt.util.linefeed);
	}

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      //var src = options.filePrefix ? (options.filePrefix + grunt.util.linefeed) : '';
      f.src.filter(function(filepath) {
		var filename = path.basename(filepath);
		var fileext = path.extname(filepath);
		if (fileext != '.h') {
			return false;
		}
		
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
		grunt.log.writeln('processing file ' + filepath );
		
		var fileext = path.extname(filepath);
		var filename = path.basename(filepath, fileext);
		var dir = path.dirname(filepath);
		
		// prepare .cpp
		var cppFilename = filename + '.cpp';
		var cppFilepathOrig = dir + '/' + cppFilename;
		var cppFileData = [];	// src data, created from .cpp
		var cppFileDataNew = [];	// to append from .h file
		var hFileDataNew = [];	// converted .h file data
		var includes = {};	// "f.h" to: 1 - old include, 2 - included from @include in .h
		var className = '';
		
		grunt.log.writeln('name: ' + filename + ', ext: ' + fileext + ', cpp: ' + cppFilepathOrig);
	
		
		if (grunt.file.isFile(cppFilepathOrig)) {
			// parse old cpp
			cppFileData = fileToArr(cppFilepathOrig);
			cppFileData.map(function(line) {
				//grunt.log.writeln(line);
				var chunks = line.trim().split(" ");
				if (chunks.length == 2 && chunks[0] == '#include') {
					includes[chunks[1]] = 1;
				}
			});
		} else {
			includes['"' + filename + '.h"'] = 2;
		}
		
		// go trough h-file
		var srcData = fileToArr(filepath);
		var implementations = [];
		
		//var funcName = false;
		var funcBody = false;
		var openBrackets = 0;
		var methodDesc = false;
		var linePreCutCpp = false;
		
		function closeBracket() {
			openBrackets--;
			if (openBrackets == 0) {
				// funcBody end!
				//implementations.push([methodDesc, funcBody]);
				funcBody = false;
				methodDesc = false;
				cppFileDataNew.push('');
			}
		}
		
		srcData.map(function(line) {
			var str = line.trim();
			var chunks = str.split(" ");
			if (chunks[0] === 'class') {
				className = chunks[1];
			}
			var isComment = false;
			if (str.charAt(0) + str.charAt(1) === '//') {
				isComment = true;
			}
			var comment = str.substring(2).trim();
			if (isComment) {
				//grunt.log.writeln('comment: ' + comment);
			}
			if (isComment && comment.charAt(0) === '@') {
				// update chunks
				chunks = comment.trim().split(" ");
				//grunt.log.writeln('t: ' + chunks[0]);
				
				if (chunks[0] === '@implement') {
					// start implementation
					funcBody = true;
					openBrackets = 0;
					methodDesc = false;
					linePreCutCpp = false;
				} else if (chunks[0] === '@include') {
					includes[chunks[1]] = 2;
				}
				return;
			}
			if (!isComment && funcBody) {
				if (!methodDesc) {
					// not yet started
					var bracket = str.indexOf('{');
					
					if (bracket > -1) {
						methodDesc = str.substr(0, bracket).trim();
						str = str.substr(bracket);
					} else {
						// no open bracket
						methodDesc = str;
						str = '';
					}
					
					linePreCutCpp = line.substr(0, line.indexOf(methodDesc));
					if (methodDesc.indexOf(className) == 0) {	// class constructor
						line = className + "::" + methodDesc + " " + str; //str.substr(bracket);
					} else {
						var methodDescArr = methodDesc.split(" ");	// ex: "void close()"
						line = methodDescArr[0] + " " + className + "::" + methodDesc.substr(methodDesc.indexOf(methodDescArr[1])) + " " + str; //str.substr(bracket);
					}
					
					/*if (bracket > -1) {
						methodDesc = str.substr(0, bracket).trim();
						linePreCutCpp = line.substr(0, line.indexOf(methodDesc));
						
						if (methodDesc.indexOf(className) == 0) {	// class constructor
							line = className + "::" + methodDesc + " " + str.substr(bracket);
						} else {
							var methodDescArr = methodDesc.split(" ");	// ex: "void close()"
							line = methodDescArr[0] + " " + className + "::" + methodDesc.substr(methodDesc.indexOf(methodDescArr[1])) + " " + str.substr(bracket);
						}
					} else {
						// no open bracket
						methodDesc = str;
						var methodDescArr = methodDesc.split(" ");	// ex: "void close()"
						linePreCutCpp = line.substr(0, line.indexOf(methodDesc));
						line = methodDescArr[0] + " " + className + "::" + line.substr(line.indexOf(methodDescArr[1]));
					}*/
					//methodDesc = methodDesc + ';';
					//grunt.log.writeln('method: ' + methodDesc);
					hFileDataNew.push(linePreCutCpp + methodDesc + ';');
				}
				if (!line) {
					return;
				}
				if (line.indexOf(linePreCutCpp) === 0) {
					line = line.substr(linePreCutCpp.length);
				}
				cppFileDataNew.push(line);
				
				// calc brackets
				for (var i = 0; i < line.length; i++) {
					var chr = line.charAt(i);
					if (chr === '{') {
						openBrackets++;
						//grunt.log.write('{');
					} else if (chr === '}') {
						/*grunt.log.write('}');
						if (openBrackets < 2) {
							grunt.log.writeln(methodDesc + ': openBrackets: '+openBrackets+', funcBody: ' + funcBody);
						}*/
						closeBracket();
					}
				}
			} else if (isComment && funcBody) {
				if (line.indexOf(linePreCutCpp) === 0) {
					line = line.substr(linePreCutCpp.length);
				}
				cppFileDataNew.push(line);
			} else {
					hFileDataNew.push(line);
				}
		});
		
		//grunt.log.writeln('className: ' + className);
		
		////////////////

		grunt.log.writeln('Dest: ' + f.dest);
		
		if (cppFileData.length + cppFileDataNew.length) {
			//h
			grunt.file.write(f.dest + "/" + filename + '.h', hFileDataNew.join(grunt.util.linefeed));
			grunt.log.writeln('File "' + f.dest + "/" + filename + '.h' + '" created.');
			
			//cpp
			Object.keys(includes).forEach(function(include) {
				if (includes[include] === 2) {
					cppFileData.push('#include ' + include);
				}
			});
			
			cppFileData.push('');
			
			grunt.file.write(f.dest + "/" + cppFilename, cppFileData.concat(cppFileDataNew).join(grunt.util.linefeed));
			grunt.log.writeln('File "' + f.dest + "/" + cppFilename + '" created.');
		}
		
		funcBody = false;
		methodDesc = false;

        return '---' + filepath;
      });

      //src += options.filePostfix ? (grunt.util.linefeed + options.filePostfix) : '';

      //grunt.log.writeln('dest file:' + f.dest);
      //grunt.log.debug(src);
      // Write the destination file.
      //grunt.file.write(f.dest, src);

      // Print a success message.
      //grunt.log.writeln('File "' + f.dest + cppFilename + '" created.');
    });
  });

};

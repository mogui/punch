var default_handler = require("../../lib/template_handler/default.js");

var fs = require("fs");

describe("get template", function(){

	it("check if the template available", function(){

		spyOn(fs, "stat");

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/test.html", spyCallback);	

		expect(fs.stat.mostRecentCall.args[0]).toEqual("template_dir/path/test.html");
	});

	it("call the callback with last modified date and full path", function(){
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 15) });
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, {"full_path": "path/test.html", "last_modified": new Date(2012, 6, 15) });

	});

	it("call the callback with an error if the template doesn't exist", function(){
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.getTemplate("path/not_exist.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("get templates", function(){

	it("check if the given path is directory", function(){

		spyOn(fs, "readdir");

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getTemplates("path/sub_dir", spyCallback);
		
		expect(fs.readdir.mostRecentCall.args[0]).toEqual("template_dir/path/sub_dir");
	});

	it("get all files (excluding hidden files) in the given directory path", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			callback(null, ["test.html", "somedir", ".git"]);	
		});

		spyOn(fs, "statSync").andCallFake(function(path){
			return {"mtime": new Date(2012, 6, 16) }	
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getTemplates("path/sub_dir", spyCallback);
		
		expect(spyCallback).toHaveBeenCalledWith(null, [ {"full_path": "path/sub_dir/test.html", "last_modified": new Date(2012, 6, 16)},
																										 {"full_path": "path/sub_dir/somedir", "last_modified": new Date(2012, 6, 16)}
		 																						   ]);

	});

	it("move one level up and filter the files in directory with the basename", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			if(path === "template_dir/path/sub_dir/index"){
				return callback("error", null);	
			} else {
				return callback(null, ["test.html", "index.html", "test2.html", "index.css"]);	
			}
		});

		spyOn(fs, "statSync").andCallFake(function(path){
			return {"mtime": new Date(2012, 6, 16) };
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getTemplates("path/sub_dir/index", spyCallback);
		
		expect(spyCallback).toHaveBeenCalledWith(null, [ {"full_path": "path/sub_dir/index.html", "last_modified": new Date(2012, 6, 16)},
																										 {"full_path": "path/sub_dir/index.css", "last_modified": new Date(2012, 6, 16)}
		 																						   ]);
	});

	it("call the callback with the error if it encounters an error when traversing directories", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			return callback("error", null);	
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.getTemplates("path/not_exist/index", spyCallback);
		
		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("read template", function(){

	it("reads the template from the filesystem", function(){
		spyOn(fs, "readFile");

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("template_dir/path/test.html");

	});

	it("calls the callback with the template content", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "template output");	
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith(null, "template output");

	});

	it("calls the callback with the error if an error occurs", function(){
		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback("error", null);	
		});

		default_handler.templateDir = "template_dir";
		
		spyCallback = jasmine.createSpy();
		default_handler.readTemplate("path/test.html", spyCallback);	

		expect(spyCallback).toHaveBeenCalledWith("error", null);

	});

});

describe("negotiate template", function(){

	it("output template content and the last modified date if it exist in the given path", function(){

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "template output");	
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 16) });	
		});

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateTemplate("path/sub_dir/index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, "template output", new Date(2012, 6, 16));
	});

	it("read the layout file in same level if template file is not found", function(){
		spyOn(fs, "readFile");

		spyOn(fs, "stat").andCallFake(function(path, callback){
			if(path === "template_dir/path/sub_dir/index.mustache"){
				return callback("error", null);	
			} else {
				return callback(null, {"mtime": new Date(2012, 6, 16) });	
			}
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateTemplate("path/sub_dir/index", ".mustache", {}, spyCallback);

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("template_dir/path/sub_dir/_layout.mustache");
	});

	it("go one level up till a layout file is found", function(){
		spyOn(fs, "readFile");

		spyOn(fs, "stat").andCallFake(function(path, callback){
			if(path === "template_dir/_layout.mustache"){
				return callback(null, {"mtime": new Date(2012, 6, 16) });	
			} else {
				return callback("error", null);	
			}
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateTemplate("path/sub_dir/index", ".mustache", {}, spyCallback);

		expect(fs.readFile.mostRecentCall.args[0]).toEqual("template_dir/_layout.mustache");
	});

	it("call the callback with an error if no layout file is found", function(){
		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback("error", null);	
		});

		default_handler.templateDir = "template_dir";

		var spyCallback = jasmine.createSpy();
		default_handler.negotiateTemplate("path/sub_dir/index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith("error", null, null);
	});

});

describe("get partials", function(){

	it("collects all partials in the given directory", function(){

		spyOn(fs, "readdir").andCallFake(function(path, callback){
			if(path == "template_dir/index"){
				return callback("error", null);		
			} else {
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache", "_partial2.mustache"]);		
			}
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17) });	
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output")	
		});
	
		var spyCallback = jasmine.createSpy();
		default_handler.getPartials("/index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output"}, new Date(2012, 6, 17));
	});

	it("traverse all parent directories looking for partials", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			if(path === "template_dir/main"){
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache"]);		
			} else if(path === "template_dir/main/sub"){
				return callback(null, ["index.html", "test.mustache", "_partial2.mustache"]);		
			} else if(path === "template_dir/main/sub/sub-sub"){
				return callback(null, ["index.html", "test.mustache", "_partial3.mustache"]);		
			} else {
				return callback("error", null);		
			}
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			return callback(null, {"mtime": new Date(2012, 6, 17) });	
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output")	
		});
	
		var spyCallback = jasmine.createSpy();
		default_handler.getPartials("main/sub/sub-sub/index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output", "partial3": "partial output"}, new Date(2012, 6, 17));

	});

	it("set the latest modified date of all partials as the last modified date", function(){
		spyOn(fs, "readdir").andCallFake(function(path, callback){
			if(path == "template_dir/index"){
				return callback("error", null);		
			} else {
				return callback(null, ["index.html", "test.mustache", "_partial1.mustache", "_partial2.mustache"]);		
			}
		});

		spyOn(fs, "stat").andCallFake(function(path, callback){
			if(path === "template_dir/_partial2.mustache"){
				return callback(null, {"mtime": new Date(2012, 6, 19) });	
			} else {
				return callback(null, {"mtime": new Date(2012, 6, 17) });	
			}
		});

		spyOn(fs, "readFile").andCallFake(function(path, callback){
			return callback(null, "partial output")	
		});
	
		var spyCallback = jasmine.createSpy();
		default_handler.getPartials("/index", ".mustache", {}, spyCallback);

		expect(spyCallback).toHaveBeenCalledWith(null, {"partial1": "partial output", "partial2": "partial output"}, new Date(2012, 6, 19));

	});

});

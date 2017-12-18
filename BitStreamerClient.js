/****************************
 
BitStreamer Client - A JS library for uploading Bulk & Large Files.
Copyright (C) 2007-2018  Ashley Johnson

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.

 ----------------------------
 BitStreamer
 ----------------------------
 The main class for BitStreamer 
 client.

 Author: Ashley Johnson
 Email: runashrunner@gmail.com

 Info: Whilst looking for 
 uploading solutions I found 
 none that I thought would suit
 me and also, were either missing
 client side or server side script
 with the download so created one.

 Its probably no where near advanced
 or probably has a few bugs but I 
 have built something that in 
 principle works and would like
 to share it with the community 
 in the hope, if nothing else that it
 will help people to understand how to 
 upload large files as chunks and put 
 them back together on the server,

 License: GPL v3
 Credits: Ashley Johnson

 Usage: If you stumble upon this script,
 feel free to use it. All I ask is that
 you retain myself in the credits and 
 that if you improve it let me know so 
 that others can benefit from it.

 Bugs: Just let me know or if you can 
 fix it do so and let me know so I can 
 add it in for the community. :)

 BitStreamer ------------------

 urlToHandler = The server script to process.
 data = the form you are attaching it to.
 size = max chunk size the server can comfortably deal with.

****************************/
function BitStreamer(urlToHandler, data, size=400000) {

	/****************************
	 formInputs
	 ----------------------------
	 This stores the form 
	 content to be processed.
	****************************/
	var formInputs = [];
	/****************************
	 formFileInputs
	 ----------------------------
	 This stores the form 
	 input values from all
	 except file uploaders
	****************************/
	var formFileInputs = [];
	/****************************
	 formFileInputFiles
	 ----------------------------
	 This stores the form 
	 input values from all
	 file uploaders
	****************************/
	var formFileInputFiles = [];

	/****************************
	 maxChunkSize
	 ----------------------------
	 Used to specify the chunk
	 size for uploading files.
	****************************/
	var maxChunkSize;


	/****************************
	 Current File Variables.
	 ----------------------------
	 Used to specify the current 
	 file for processing. Set
	 after each title has been
	 processed,
	****************************/
	var currentFileID = 0; 					// Unique Identifier
	var currentFilename;					// Filename as String
	var currentFileSize = 0;				// Filesize of current file.
	var currentFileAsBlob;					// A variable to store the current file as a Blob
	var currentFileChunk = 0;				// The current chunk to be sent to the server.
	var currentFileOffset = 0;				// The current position of the chunk that needs uploading.
	var currentFileTotalChunks = 0;			// Total chunks required in order to upload the file.
	var currentFileChunksSent = 0;			// How many chunks have been sent
	var currentFileChunksTransfered = 0;	// How many chunks have been recieved.
	var currentFileProgress = 0;			// The progress of the current file.

	/****************************
	 uploadsArePaused
	 ----------------------------
	 (Bool) Lets the script know
	 if the user has invoked the
	 pause button.
	****************************/
	var uploadsArePaused = false;			

	/****************************
	 chunksForAllFiles
	 ----------------------------
	 How many chunks in total
	 for the whole form.

	 Used for Overal Progress
	****************************/
	var chunksForAllFiles = 0;
	/****************************
	 chunksForAllFilesProcessed
	 ----------------------------
	 How many chunks have been
	 processed in total.

	 Used for Overal Progress
	****************************/
	var chunksForAllFilesProcessed = 0;

	/****************************
	 this.submitUploadForm
	 ----------------------------
	 The main process that begins
	 to upload the files.
	****************************/

	this.submitUploadForm = function() {
		var formItems = data.find(":input"); //Find all input fields in the form attached
		/****************************
		 Loop
		 ----------------------------
		 The loop below sorts file
		 inputs from the rest in two
		 seperate arrays.
		****************************/
		for(i = 0; i < formItems.length; i++) {
			if(formItems[i].type === "file") {
				formFileInputs.push(formItems[i]); // its a file so add to formFileInputs array
			} else {
				formInputs.push(formItems[i]); // its not a file so add to formItems array
			}
		}

		console.log("Setting maxChunkSize to "+size);
		maxChunkSize = size;

		$('#progress').show(); // Show progress bar. Improvement needed.

		console.log("Preparing file upload...");

		console.log("----- Uploading -----")

		$('#filesbox').html(""); // Reset the files box. Improvement needed. Very Basic.
		/****************************
		 Loop
		 ----------------------------
		 The loop go through the files
		 to upload and assigns a progress
		 bar in the #filesbox as well as 
		 tallying up how many chunks will
		 need to be sent in total.

		 Again, I will improve on this soon.
		****************************/
		for(f=0; f<formFileInputs.length; f++) {
			var filesToUpload = formFileInputs[f].files;
			for(u=0; u<filesToUpload.length; u++) {
				formFileInputFiles.push(filesToUpload[u]);
				$('#filesbox').append("<p style='text-align: left; text-transform: uppercase; margin-bottom: 2px; padding-right:0; font-family: arial;'><span id='file"+u+"'>"+filesToUpload[u].name+"</span><span style='float: right;' id='progress-status"+u+"'></span></p><div id='bar_container' style='width: 100%; background-color: #bbb; height: auto; margin-top: 5px; margin-bottom: 10px;'><div id='bar"+u+"' style='height: 5px; font-size: 80%; background-color: #00a300; transition:600ms linear; color:#ffffff; font-family: sans-serif; width: 0px;''></div></div>");
				chunksForAllFiles = chunksForAllFiles + Math.ceil(filesToUpload[u].size/maxChunkSize, maxChunkSize);
				console.log(filesToUpload[u].name);
			}
		}
		console.log("----- Uploading -----")

		/****************************
		 Loop
		 ----------------------------
		 Just for debugging purposes.
		 Loops though other data fields
		 and if name is not "" prints
		 them to the JS console.
		****************************/
		console.log("----- DATA to send with files -----")
		for(fi=0; fi<formInputs.length; fi++) {
			if(formInputs[fi].name != "") {
				console.log(formInputs[fi].name);
			}
		}
		console.log("----- DATA to send with files -----")

		$('#pause').show(); // Show pause button, Improvement Needed
		$('form').hide(); // Hide form: this unfortunatley assums its the only form on the page.
		this.processFile(); // Start proccessing the first file.
	}

	/****************************
	 this.processFile
	 ----------------------------
	 Starts the process of uploading
	 the current file.
	****************************/

	this.processFile = function() {

		if(currentFileID > (formFileInputFiles.length-1)) return false; // If there are no more files... end.
		$("#file"+currentFileID).css("font-weight", "bold"); // Set the current filename to be bold in the files box.

		console.log("Setting filename to "+formFileInputFiles[currentFileID].name);
		// Set the filename
		currentFilename = formFileInputFiles[currentFileID].name;
		console.log("Setting fileSize to "+formFileInputFiles[currentFileID].size);
		// Set the file size.
		currentFileSize = formFileInputFiles[currentFileID].size;
		// Set total chunks for this file.
		currentFileTotalChunks = Math.ceil(formFileInputFiles[currentFileID].size/maxChunkSize, maxChunkSize)-1;
		console.log("totalChunks to send are "+(currentFileTotalChunks+1));
		// Store file as Blob.
		currentFileAsBlob = formFileInputFiles[currentFileID];
		//Start processing the individual chunks.
		this.processChunk();
	}

	/****************************
	 this.pauseFileUpload
	 ----------------------------
	 Pauses the file upload process
	 until the user resumes it
	****************************/

	this.pauseFileUpload = function() {
		console.log("Paused at chunk: "+currentFileChunk);
		// Set the uploadsArePaused flag to true
		uploadsArePaused = true;

	}

	/****************************
	 this.resumeFileUpload
	 ----------------------------
	 Resumes the file upload process
	 from the next chunk.

	 P.S the pause process only starts
	 after chunk was uploaded so resume
	 calls next chunk... 
	****************************/

	this.resumeFileUpload = function() {
		console.log("Resuming at chunk: "+currentFileChunk);
		// Set the uploadsArePaused flag to false
		uploadsArePaused = false;
		// Hide the resume button and show the pause button again.
		$('#resume').hide();
		$('#pause').show();

		//Process the next chunk.
		this.processNextChunk();
	}

	/****************************
	 this.processNextFile
	 ----------------------------
	 After a file is finished 
	 uploading this is called to
	 upload the next file (if any)
	****************************/

	this.processNextFile = function() {
		if(!uploadsArePaused) {
			// Uploads are not paused so continue...
			$("#file"+currentFileID).attr("style", "font-weight: normal;");
			console.log("Looking for next file...");
			currentFileID++;
			var filesToProcess = formFileInputFiles.length-1;
			console.log(currentFileID+"/"+filesToProcess);
			if(currentFileID > filesToProcess) {
				$('#bar').css('width', "100%");
				$('#progress-status').html("100%");
				// No More files to process. So upload finished.
				$('#resume').hide();
				$('#pause').hide();
				$('#bar').css('background-color', '#00a300');
				console.log("No more files found..."); 
				return;
			} else {
				// More files to process.
				$('#bar').css('width', 0+"%");
				console.log("Next file found, Uploading...");
				currentFileChunk = 0;
				this.processFile();
			}
		} else {
			// Uploads are paused so wait.
			$('#resume').show();
			$('#pause').hide();
		}
	}

	/****************************
	 this.waitACottonPickingMinuteLetTheAjaxHaveABeer
	 ----------------------------
	 LOLZ, I had the trouble that smaller files were
	 making the server give a 403 Forbidden as when
	 uploading say 50+ images under a MB or so it
	 was pinging the server every few seconds. So to
	 stop the server returning forbidden, I used a 
	 script I had found somewhere online and modified it.

	 I thought the function name (Credit: Me [Ashley Johnson]) was appropriate.
	 Maybe this can be the first uploader with a laugh to.
	****************************/

	this.waitACottonPickingMinuteLetTheAjaxHaveABeer = function(ms){
		console.log("Giving the Ajax a Beer!");
		var start = new Date().getTime();
		var end = start;
		while(end < start + ms) {
			end = new Date().getTime();
		}
	}

	/****************************
	 this.processNextChunk
	 ----------------------------
	 After a chunk has finished 
	 uploading this is called to
	 upload the next chunk (if any)
	****************************/

	this.processNextChunk = function() {
		if(!uploadsArePaused) {
			// Uploads are not paused so continue...
			console.log("Looking for next chunk...");
			currentFileChunk++;
			chunksForAllFilesProcessed++;
			if(currentFileChunk > currentFileTotalChunks) {
				// No More chunks to process so call processNextFile().
				console.log("No more chunks found..."); 
				this.processNextFile();
			} else {
				// More chunks to process.
				console.log("Next Chunk Found, Sending...");
				this.processChunk();
			}
		} else {
			// Uploads are paused so wait.
			$('#resume').show();
			$('#pause').hide();
		}	
	}

	/****************************
	 this.processChunk
	 ----------------------------
	 This is the function that
	 communicates with the server.

	 It will send the chunk to the
	 server with information on which 
	 file it is, current chunk number,
	 total chunks for file etc...
	****************************/

	this.processChunk = function() {

		// If there are no more chunks... end.
		if(currentFileChunk > currentFileTotalChunks) return false;

		currentFileOffset = currentFileChunk * maxChunkSize;
		currentBlob = currentFileAsBlob.slice(currentFileOffset, maxChunkSize+currentFileOffset);
		
		var chunkEndPoint = maxChunkSize+currentFileOffset;
		
		var totalProgress;

		console.log(chunksForAllFiles);

		if (chunksForAllFiles != 0) {
			totalProgress = Math.ceil((100/chunksForAllFiles) * chunksForAllFilesProcessed);
			console.log("Progress By Chunk: "+totalProgress);
			console.log("File ID: "+currentFileID);
			console.log(chunksForAllFilesProcessed);
		} else {
			totalProgress = Math.ceil((100/formFileInputFiles.length) * currentFileID);
			console.log("Progress By Files Completed: "+totalProgress);
			console.log("File ID: "+currentFileID);
		}
		 

		if (currentFileTotalChunks == 0) {
	    	currentFileProgress = 100;
	    } else {
	    	currentFileProgress = Math.ceil((100/currentFileTotalChunks)*currentFileChunk);
	    }
	    $('#bar'+currentFileID).css('width', currentFileProgress+"%");
	    $('#bar').css('width', totalProgress+"%");
		$('#progress-status').html(totalProgress+"%");
		$('#progress-status'+currentFileID).html(currentFileProgress+"%");

		console.log("Sending Chunk "+(currentFileChunk + 1)+"/"+(currentFileTotalChunks+1));
		console.log("Chunk Start: "+currentFileOffset);
		console.log("Chunk End: "+chunkEndPoint);

		// Create new FormData() Obj.
		var fData = new FormData();
		/****************************
		 Loop
		 ----------------------------
		 Go through non file inputs and
		 appends the FormData to the
		 FormData() obj.
		****************************/
		for(i=0; i<formInputs.length; i++) {
			fData.append(formInputs[i].name, formInputs[i].value);
		}
		fData.append('filename', currentFilename); // the filename of the current file.
		fData.append('chunk_as_binary', currentBlob); // The chunk being uploaded as a Blob.
		fData.append('chunk_id', currentFileChunk); // Information on current chunks for current file.
		fData.append('chunk_tally', currentFileTotalChunks); // Information on total chunks for current file.

		$.ajax({
			context: this,
			type: 'POST',
			url: urlToHandler, // URL to BS server PHP (Your file Handler)
			data: fData, // Form data.
			processData: false, // Keep as false. we dont want Ajax to process the data.
			contentType: false, // Dont set content type.
			error: function() { 
				//If an error occurs try to process again.
				this.processChunk(); 
			},
			success: function() { 
				//Success - Call this.processNextChunk()
				this.waitACottonPickingMinuteLetTheAjaxHaveABeer(500);
				this.processNextChunk(); 
			}
		});
	}
}




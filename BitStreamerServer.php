<?php 

/*

BitStreamer Server - A PHP handler for uploading Bulk & Large Files.
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

	A VERY BASIC UPLOAD HANDLER FOR BITSTREAMER.
	Author: Ashley Johnson
	Email: runashrunner@gmail.com
	Copyright: Ashley Johnson (c)2017
	License: GPLv3

	Decsription:

	This is just a basic example of how the file can be processed on the server.
	This will take the bits, store them, then, when are uploaded put them back
	together.

	This example uses exec() and the cat command line function to put the files back
	so make sure you have these. They should be pretty standard for your run-of-the-mill 
	Linux Server.

	 Usage: If you stumble upon this script,  feel free to use it. All I ask is that  
	 you retain myself in the credits and that if you improve it let me know so that 
	 others can benefit from it.

 	 Bugs: Just let me know or if you can  fix it do so and let me know so I can  add it in for the community. :)
*/


// Set uploads Directory
$uploadDirectory = dirname(__FILE__)."/uploads/";

//If the directory dont exist, create it.
if (!is_dir($uploadDirectory)){
    mkdir($uploadDirectory, 0777, true);
}

$file = str_replace(" ", "_", $_POST['filename']);

// If we have posted a chunk in the $_FILES array then
// Move the file to the uploads folder and assign it a part number.
if($_FILES) {
	move_uploaded_file($_FILES['chunk_as_binary']['tmp_name'], $uploadDirectory.$file.".part".$_POST['chunk_id']);

}

if($_POST['chunk_id'] === $_POST['chunk_tally']) {
	//Set final file location.
	$file_location = $uploadDirectory.$file;
	// Copile the list of parts to merge.
	for ($i = 0; $i <= $_POST['chunk_tally']; $i++) {
	    $files[] = $uploadDirectory.$file.".part".$i;
	}

	// Merge all parts together using cat.
	// e.g "cat file.part1 file.part2 > file.complete" 
	$catCmd = "cat " . implode(" ", $files) . " > " . $uploadDirectory.$file;
	exec($catCmd);

	// Remove the chunks after merging them into final file,
	for ($i = 0; $i <= $_POST['chunk_tally']; $i++) {
	    unlink($uploadDirectory.$file.".part".$i);
	    echo "<p>Removing ".$uploadDirectory.$file.".part".$i."</p>";
	}
}

?>
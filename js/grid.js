angControllers.controller('GridCtrl', ['$scope', '$http', '$sce','$routeParams', 'Data',

// function GridCtrl($scope,$http, $sce, $routeParams, Data) {
	
function($scope,$http, $sce, $routeParams, Data) {


	var diameter = 700,
	radius = diameter / 2,
	innerRadius = radius - 120;

	$scope.viewMode = "packery";
	

	var cluster,bundle,line,svg,link,node,tag,data,filteredData;

	Data.getDataAsync(function(results) {
	
		data = wp_json_to_d3_json(results.posts);
		if(results.posts.length > 3){
			$scope.viewMode = "vis";
		}


		svg = d3.select("#vis_container").append("svg")
			.attr("width", diameter)
			.attr("height", diameter)
			.append("g")
			.attr("transform", "translate(" + radius + "," + radius + ")");

		makePackeryGrid(results.posts);
		makeGraph();
	});
	function makePackeryGrid(data){
		var dimensions = [200,200,400,400];

		$scope.gridData =data;
		console.log(data);
		for (var i = 0; i < $scope.gridData.length; i++) {
	    	$scope.gridData[i].width=dimensions[getRandomInt(1,3)];
	    	$scope.gridData[i].height=dimensions[getRandomInt(1,3)];
	    	if($scope.gridData[i].attachments[0])$scope.gridData[i].url = "url("+$scope.gridData[i].attachments[0].url +")";
	    	
	    	
		};

		
	}
	function getRandomInt(min, max) {
    	return Math.floor(Math.random() * (max - min + 1)) + min;
	}
  	function getRandomColor() {
		var letters = '0123456789ABCDEF';
		var color = '#';
		for (var i = 0; i < 6; i++ ) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
	
	function wp_json_to_d3_json(wp_json){
		d3JSON = {};

		var nodes = {};
		var links = [];
		var tags = {};
		

		function newNode(post){

			// "nodes":{
			// 		key	:{
			// 			title:"title"
			// 			key:ID
			// 			parent:Object
			// 			children:Array[]
			//			date:date
			// 		},
			var key = (post.title_plain === undefined) ? "" : post.title_plain; 

			//only add unique nodes
			if(!(key in nodes)){
				//create a blank node
				var node = nodes[key] = {key: "", children: []};
				
				if (key !== "") { //it's not the root node
					node.parent = newNode("");//defalt only one depth
					node.parent.children.push(node);
					node.key = post.title_plain;
					node.id = post.id;
					node.title = post.title_plain;
					node.tags = [];
					node.date = new Date(post.date);
					nodes[key] = node;
				}
			}
			
			//return new node or existing node if it already exists
			return nodes[key];
		}

		function newLink(source,target,tag){

			// "links":[
			// 		{
			// 			"source": nodeID,
			// 			"target": nodeID,
			// 			"tag": tagID
			// 		},
			// 		...

			var exists = links.find(function( link ) {
				return link.source === nodes[source] && link.target === nodes[target] && link.tag === tags[tag];
			});

			if(!exists){
				links.push({"source":source,"target":target,"tag":tag});
				tag.LinkCount += 1;
				if (source.tags.indexOf(tag) == -1) {
					source.tags.push(tag);
				}

				if (target.tags.indexOf(tag) == -1) {
					target.tags.push(tag);
				}   


				return links.length-1;
			}else{
				return exists;
			}			
		}

		function newTag(postTag){

			// "tags":[
			// 		{
			// 			"tagID": tagID,
			// 			"catogary": catogary,
			// 			"value": value,
			//			"LinkCount":n
			// 		},
			// 		...

			//only add unique tags
			if(!(postTag.slug in tags)){
				var tag = {};
				tag.id = postTag.id;
				tag.colour = getRandomColor();
				tag.LinkCount = 0;

				var t = postTag.title.split(":");
				if (t.length>1){
					tag.catogary = t[0];
					tag.value = t[1];
				}else{
					tag.catogary = 'null';
					tag.value = t[0];
				}

				tags[postTag.slug] = tag;
			}

			return tags[postTag.slug];
		}


		//for all the posts
		for (var i = 0; i < wp_json.length; i++) {
			var this_post = wp_json[i];

			var sourceNode = newNode(this_post);

			for (var k = 0; k < this_post.tags.length; k++) {
				
				var tagIndex = newTag(this_post.tags[k]);
		
				for (var j = 0; j < wp_json.length; j++) {
					
					//don't compare a post with itself
					if(i!=j){
						var other_post = wp_json[j];
						for (var l = 0; l < other_post.tags.length; l++) {
							var this_cat = this_post.tags[k].title.trim().toLowerCase();
							var that_cat = other_post.tags[l].title.trim().toLowerCase();
							if(this_cat==that_cat){
								var targetNode = newNode(other_post);
								newLink(sourceNode,targetNode,tagIndex);
							}
						}
					}
				}
			}
		}

		d3JSON = {
			"nodes":nodes,
			"links":links,
			"tags":tags
		};

		return d3JSON;
	} 	

	//

	//main function for making the vis - where the magic happens
	function makeGraph(date){	

		svg.selectAll("*").remove();
		console.log(date);
		if (date==undefined){
			filteredData = angular.copy(data);
		}else{
			filteredData = filterData(angular.copy(data),date);
		}
		

		cluster = d3.layout.cluster()
			.size([360, innerRadius])

			.sort(function(a, b) { 
					return d3.descending(b.title.toLowerCase(), a.title.toLowerCase()); })
			.value(function(d) { return d.size; });

		bundle = d3.layout.bundle();

		line = d3.svg.line.radial()
			.interpolate("bundle")
			.tension(0.55)
			.radius(function(d) { return d.y; })
			.angle(function(d) { return d.x / 180 * Math.PI; });

		

		link = svg.selectAll(".link"),
		node = svg.append("g").attr("class","all_nodes").selectAll(".node"),
		tag = d3.select(".tag").selectAll("p");


		  ////here's where we link the json with the D3 objects
		var nodes = cluster.nodes(filteredData.nodes[""]),
		 	links = filteredData.links,
		 	tags = Object.keys(filteredData.tags).map(function (key) {return filteredData.tags[key];});


		link = link
			.data(bundle(links))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("d", line);


		node = node
			.data(nodes
				.filter(function(n) { return !n.children; }))			
			.enter()
			.append("svg")
			.attr("id", function(d){return "id_"+d.id})
			.each(function(d) {
				d3.select(this).append("text")
					.text(function(d) { return d.key; })
					.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ","+(d.x < 180 ?4:-4)+")" + (d.x < 180 ? "" : "rotate(180)"); });
				
				d3.select(this).append("rect")
					.attr("x", -10)
					.attr("y", -20)
					.attr("width", 200)
					.attr("height", 40)
					.attr("fill-opacity", 0)
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8 +(d.x < 180 ?0:180)) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); });
			})
			
			.attr("class", "node")
			.attr("dy", ".31em")
			.attr("cursor","pointer")
			///last part of the transform is to test whether we are past the 180 mark to flip the text
			
			
			.on("mouseover", mouseovered)
			.on("click", clicked)
			.on("mouseout", mouseouted);
			
		
		//my addition - adds colour coded tags with mouse interaction for highighting KINDS of connection
		tag = tag
			.data(tags
				.filter(function(d) { return d.LinkCount>0; })
				.sort(function(a, b) { return d3.ascending(b.catogary, a.catogary) || d3.descending(parseFloat(a.LinkCount), parseFloat(b.LinkCount)) }))
			.enter()
			.append("p")
			.style("color", function(d){  return d.colour })
			.text(function(d){  return d.catogary+" : "+d.value+" ["+d.LinkCount/2+"]" })
			.on("mouseover", function (d){
				console.log(d);
				//for each link check if the node at BOTH ends contains the tag you're interested in and return the colour
				link.style("stroke", function (l){ return getLinkTagHighlight(l, d)})
					//filter for having tags and apply a thicker stroke to everything afterwards
					.filter(function(l){ return linkHasTag(l, d) })
					.classed("link--tagged", true)
					.each(function() { this.parentNode.appendChild(this); });

				node
					.filter(function(l){ return nodeHasTag(l, d) })
					.classed("node--target", true)
					.classed("node--source", true)
					.each(function() { this.parentNode.appendChild(this); });
			})
			.on("mouseout", function (d){
				link.style("stroke", "steelblue")
					.classed("link--tagged", false);
				node
					.classed("node--target", false)
					.classed("node--source", false);
			});	
		
	
		function clicked(d){			
			window.location.href = '#/grid/'+d.id;
		}

		function mouseovered(d) {
			//get a unique list of the tags from this node
			var active_tags = d.tags;
			///make a dot for each node that has a matching tag
			node.each(function(nd){
				var this_nodes_tags = nd.tags;
				var spacing=14;
				var tag_count = 0;
				active_tags.forEach(function(t){
					this_nodes_tags.forEach(function(tn){
						//if this node has a tag matching the rolled over tag then....
						if(t==tn){
							//make the transform and add a circle at distance = spacing * tag_count 
							var transf = "rotate(" + (nd.x - 90) + ")translate(" + (nd.y + 8 + (tag_count * spacing) ) + ",0)" + (nd.x < 180 ? "" : "rotate(180)");
							svg.select("g")
								.append("circle")
								.attr("pointer-events","none")
								.attr("stroke-width","3")
								.attr("fill","none")
								.attr("stroke",tn.colour)
								.attr("class", "tag_circle")
								.attr("r",spacing* 0.3)
								.attr("transform", transf );//function(d) { if (d) return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
							//increment for the next circle
							tag_count++;
						}
					});
				});
				//you can't have numeric IDs in d3
				var id = "id_"+nd.id;
				d3.select("#"+id).select("text").transition()
					.duration(450)
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8 + tag_count * spacing) + ","+(d.x < 180 ?4:-4)+")" + (d.x < 180 ? "" : "rotate(180)"); })
			});

			//from the example  - turn off all the nodes' flags identifying them as targets or sources for the links
		  node
		      .each(function(n) { n.target = n.source = false; });


		  ///I can't work out why l.source.source rather than just l.source
		  link
			.classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
			.classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
		      //below is just to bring the right nodes to the front - filter applies itself on anything further on in the method chain	
		    .filter(function(l) { return l.target === d || l.source === d; })
		    ///this.parentNode.appendChild(this) just takes the child off and sticks it back on again bringing it to the front
		      .each(function() { this.parentNode.appendChild(this); });

		  node
		      .classed("node--target", function(n) { return n.target; })
		      .classed("node--source", function(n) { return n.source; });
		}

		function mouseouted(d) {
			link
				.classed("link--target", false)
				.classed("link--source", false);

			node
				.classed("node--target", false)
				.classed("node--source", false)
				//transition back to original position
				.select("text").transition()
				.duration(450)
				.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ","+(d.x < 180 ?4:-4)+")" + (d.x < 180 ? "" : "rotate(180)"); });

			///get rid of all the little circles
			d3.selectAll(".tag_circle").remove();
		}
		
		function getLinkTagHighlight(l, t){
			//if the link connects to nodes having a tag then return the mapped colour otherwise return default
			if(linkHasTag(l, t)){
				return t.colour;
			}
			return "steelblue";

		}

		function linkHasTag(link, tag){
			var has_tag = false;
			//must have tag both end to return true
			var source = nodeHasTag(link.source,tag);
			var target = nodeHasTag(link.target,tag);

			if (source && target) has_tag = true;
	
			return has_tag;
		}
		function nodeHasTag(node, tag){
			var has_tag = false;
			node.tags.forEach(function(n){
				if(n===tag) {
					has_tag = true;
				}
			});
			return has_tag;
		}

		d3.selectAll("input").on("change", change);

		function change() {
			if (this.value === "date1")
				makeGraph(new Date("2015-12-16 10:38:50"));
			else if (this.value === "date2")
				makeGraph(new Date("2016-03-09 15:37:58"));
			else
				makeGraph();
		}

		//this is a bit hacky!
		function filterData(data,date){	

			for (var n in data.nodes) {
				if (data.nodes[n].hasOwnProperty("date")) {
					if (data.nodes[n].date>date)
						delete data.nodes[n];
				}
			}

			for(var i = data.nodes[""].children.length -1; i >= 0 ; i--){
				if(data.nodes[""].children[i].date>date){
					data.nodes[""].children.splice(i, 1);
				}
			}

			for(var i = data.links.length -1; i >= 0 ; i--){
				if(data.links[i].source.date>date && data.links[i].target.date>date){
					data.links.splice(n, 1);
				}
			}

			return data;
		}

		///dunno what this is for -matching diameter of svg to height of screen? 
		d3.select(self.frameElement).style("height", diameter + "px");

	}
}]);
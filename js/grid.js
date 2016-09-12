angControllers.controller('GridCtrl', ['$scope', '$http', '$sce','$routeParams', 'Data',

// function GridCtrl($scope,$http, $sce, $routeParams, Data) {
	
function($scope,$http, $sce, $routeParams, Data) {


	var diameter = 600,
	radius = diameter / 2,
	innerRadius = radius - 120;

	$scope.viewMode = "packery";
	

	var cluster,bundle,line,svg,link,node,tag,data,filteredData;

	Data.getDataAsync(function(results) {
	
		data = wp_json_to_d3_json(results.posts);
		if(data.links.length > 3){
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
		var categories = {};
		

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

				return links.length-1;
			}else{
				return exists;
			}			
		}

		function newCategory(postCategory){
			// "category":
			// 		key:{
			// 			"categoryID": categoryID,
			// 			"category": category,
			//			"children" [tagID,]
			// 		},
			// 		...
			if(!(postCategory.id+"_id" in categories)){
				var category = {};
				category.id = postCategory.id+"_id";
				category.category = postCategory.title.slice(4);
				category.children = [];

				categories[postCategory.id+"_id"] = category;
			}

		}


		function newTag(postTag){

			// "tags":
			// 		key:{
			// 			"tagID": tagID,
			// 			"value": value,
			//			"parent": categoryID,
			//			"LinkCount":n
			// 		},
			// 		...

			//only add unique tags
			if(!(postTag.slug in tags)){
				var tag = {};
				tag.id = postTag.id;
				tag.colour = getRandomColor();
				tag.LinkCount = 0;
				tag.value = postTag.title;
				tag.parent = categories[postTag.parent+"_id"];
				tag.key = postTag.slug;

				tags[postTag.slug] = tag;

				//add tag to categories
				categories[postTag.parent+"_id"].children.push(tag);
			}

			return tags[postTag.slug];
		}


		//for all the posts
		for (var i = 0; i < wp_json.length; i++) {
			var this_post = wp_json[i];

			var sourceNode = newNode(this_post);

			for (var k = 0; k < this_post.categories.length; k++) {
				
				// WARNING: relise on categories being before tags in the JSON
				if (this_post.categories[k].title.includes(". ")){
					//create tage catogary but not link
					newCategory(this_post.categories[k]);
				}else{
					var tagIndex = newTag(this_post.categories[k]);
					
					if (sourceNode.tags.indexOf(tagIndex) == -1) {
						sourceNode.tags.push(tagIndex);
					}
		
					// loop to find matching tags
					for (var j = 0; j < wp_json.length; j++) {
						
						//don't compare a post with itself
						if(i!=j){
							var other_post = wp_json[j];
							for (var l = 0; l < other_post.categories.length; l++) {
								var this_cat = this_post.categories[k].title.trim().toLowerCase();
								var that_cat = other_post.categories[l].title.trim().toLowerCase();
								if(this_cat==that_cat){
									var targetNode = newNode(other_post);
									if (targetNode.tags.indexOf(tagIndex) == -1) {
										targetNode.tags.push(tagIndex);
									}
									newLink(sourceNode,targetNode,tagIndex);
								}
							}
						}
					}
				}
			}
		}

		d3JSON = {
			"nodes":nodes,
			"links":links,
			"categories":categories,
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
		category = d3.select(".tag").selectAll("button"),
		tag = d3.select(".tag").selectAll("p");


		  ////here's where we link the json with the D3 objects
		var nodes = cluster.nodes(filteredData.nodes[""]),
		 	links = filteredData.links,
		 	categories = Object.keys(filteredData.categories).map(function (key) {return filteredData.categories[key];}),
		 	tags = Object.keys(filteredData.tags).map(function (key) {return filteredData.tags[key];});


		link = link
			.data(bundle(links))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("stroke-width", function(d) {return getLinkCount(d.source,d.target)*2})
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
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 15) + ","+(d.x < 180 ?4:-4)+")" + (d.x < 180 ? "" : "rotate(180)"); });
				
				d3.select(this).append("rect")
					.attr("x", -10)
					.attr("y", -10)
					.attr("width", 200)
					.attr("height", 40)
					.attr("fill-opacity", 0)
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8 +(d.x < 180 ?0:180)) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); });

				var transf = "rotate(" + (d.x - 90) + ")translate(" + (d.y+5) + ",0)" + (d.x < 180 ? "" : "rotate(180)");
				d3.select(this).append("circle")
					.attr("pointer-events","none")
					.attr("stroke-width","3")
					.attr("fill","none")
					.attr("class", "circle")
					.attr("r", 5)
					.attr("transform", transf );
			})
			
			.attr("class", "node")
			.attr("dy", ".31em")
			.attr("cursor","pointer")
			///last part of the transform is to test whether we are past the 180 mark to flip the text
			
			
			.on("mouseover", mouseovered)
			.on("click", clicked)
			.on("mouseout", mouseouted);
			
		
		category = category.data(categories
				.filter(function(n) { return  hasChildrenWithLinks(n)}))
			.enter()
			.append("div")
			.each(function(d) {
				d3.select(this).append("button")
					.attr("class", "accordion")
					.on("click", function(d) {
        				console.log(this);
        				this.classList.toggle("active");
        				this.nextElementSibling.classList.toggle("show");
        			})
        			.append("span")
        			.attr("title",function(d){  return d.category})
        			.text(function(d){ 
        				return d.category.slice(0,23)+ (d.category.length>23 ? "..." : "");});

				d3.select(this).append("div")
					.attr("class", "panel")
					.attr("id", function(d){  return d.id;})
					.each(function(d) {
						var tagDiv = d3.select(this);

						for (var i = 0; i < d.children.length; i++) {
							if (d.children[i].LinkCount>0){
								tagDiv.append("p")
									//.style("color", function(d){  return d.children[i].colour })
									.text(function(d){  return d.children[i].value })
									.attr("id", function(d){  return d.children[i].key;})
									.on("mouseover", function (t){

										//TODO: this is a bit of a hacky way, should make direct referance to the objects rather than using the element id
										var this_tag = this.id.toString();

										//for each link check if the node at BOTH ends contains the tag you're interested in and return the colour
										link
											//filter for having tags and apply a thicker stroke to everything afterwards
											.filter(function(l){ return linkHasTag(l, this_tag) })
											.classed("link--tagged", true)
											.each(function() { this.parentNode.appendChild(this); });

										node
											.filter(function(l){ return nodeHasTag(l, this_tag) })
											.classed("node--target", true)
											.classed("node--source", true)
											.each(function() { this.parentNode.appendChild(this); });
									})
									.on("mouseout", function (d){
										link.style("stroke", null)
											.classed("link--tagged", false);
										node
											.classed("node--target", false)
											.classed("node--source", false);
									});	
								}
							}
						}
        			);
        		});
	
		function hasChildrenWithLinks(c){
			for (var i = 0; i < c.children.length; i++) {
				if (c.children[i].LinkCount>0){
					return true;
				}
			}
			return false;
		}

		function clicked(d){			
			window.location.href = '#/grid/'+d.id;
		}

		function mouseovered(d) {
			//get a unique list of the tags from this node
			var active_tags = d.tags;

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

		}
		
		function getLinkTagHighlight(l, t){
			//if the link connects to nodes having a tag then return the mapped colour otherwise return default
			if(linkHasTag(l, t)){
				return data.tags[t].colour;
			}
			//return "steelblue";

		}

		function getLinkCount(source,target){
			var count = 0;
			for(var i = 0; i < data.links.length ; i++){
				if(data.links[i].source.id==source.id && data.links[i].target.id===target.id){
					count ++;
				}
			}
			return count;
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
				if(n.key===tag) {
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
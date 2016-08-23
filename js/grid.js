angControllers.controller('GridCtrl', ['$scope', '$http', '$sce','$routeParams', 'Data',

// function GridCtrl($scope,$http, $sce, $routeParams, Data) {
	
function($scope,$http, $sce, $routeParams, Data) {
	var all_tags = [];
	var tag_colours = {};

	function get_tag_colours(tag){
	   		return tag_colours[n % tag_colours.length];
	}
	var cols;
	Data.getDataAsync(function(results) {
	   //

	    console.log("results",results);	
	    $scope.projects = results.posts;
	   	var d3_json = wp_json_to_d3_json(results.posts);
	   	$scope.d3_json = d3_json;

	   
	   console.log(d3_json);
	   	d3_json.forEach(function(d){
	   		d.tags.forEach(function(t){
	   		//	console.log(t);
	   			if (all_tags.indexOf(t)===-1) {
	   				all_tags.push(t);
	   			};
	   		});
	   	});

	
	   	//TODO - dangerous, remove!
	   	 cols = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b', "#ff9896","9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "f7b6d2",  "#7f7f7f"];
	   	//console.log(cols);

	   	
	  
	   	//var tag_colours = [];
	   	for (var i = 0; i < all_tags.length; i++) {
	   		//console.log(i,all_tags[i]);
	   		tag_colours[all_tags[i]] = cols[i % all_tags.length];
	   		
	   	};

	   	
	   	
	   	
	   	$scope.tag_colours = tag_colours;
	   	//this is a nasty old hack - somehow my function for getting the d3 friendly json was introducing a cyclic object which breaks the json parser by casting it to a string and then back I get rid of the refeerences!
	   	var str = JSON.stringify(d3_json);
	   	var jsn = JSON.parse(str);
	   	
	   	makeGraph(jsn);
	});

	
  	
	
	function wp_json_to_d3_json(wp_json){
		d3_json = [];

		//for all the posts
		for (var i = 0; i < wp_json.length; i++) {
			var this_post = wp_json[i];
			//var new_node={};
			//lets compare to all the other posts
			var imports = [];
			var tags = [];
			for (var j = 0; j < wp_json.length; j++) {
				var other_post = wp_json[j];
				//don't compare a post with itself
				if(i!=j){

					//lets use tags as an example
					for (var k = 0; k < this_post.tags.length; k++) {
						var this_cat = this_post.tags[k].title.trim().toLowerCase();
						if(this_cat =="sound") console.log("sound", this_post.title);
						for (var l = 0; l < other_post.tags.length; l++) {
							var that_cat = other_post.tags[l].title.trim().toLowerCase();
							if(this_cat==that_cat){
								tags.push(this_cat);
								if(imports.indexOf(other_post.title) == -1){
									//somehow I want to use a structure like this to define kinds of connection
									// var an_obj = {
									// 	name: other_post.title,
									// 	tag: this_cat
									// }
									//imports.push(an_obj);
									imports.push(other_post.title);
									
								}
							}
						};
					};

				}
			}
		
			
			var new_node = {
				name:this_post.title,
				size:0,
				imports:imports,
				id:this_post.id,
				tags:tags
			}
			d3_json.push(new_node);
		};
		/*
			each object should be of the format
			{
		    "name": "flare.analytics.cluster.CommunityStructure",
		    "size": 3812,
		    "imports": [
		      "flare.analytics.cluster.HierarchicalCluster",
		      "flare.animate.Transitioner",
		      "flare.vis.data.DataList",
		      "flare.analytics.cluster.MergeEdge",
		      "flare.util.math.IMatrix"
		    	]
  			}
		*/
		return d3_json;
	} 	
	//main function for making the vis - where the magic happens
	function makeGraph(myjson){	
			///directly from d3 example
		var diameter = 700,
		    radius = diameter / 2,
		    innerRadius = radius - 120;

		 var cluster = d3.layout.cluster()
		    .size([360, innerRadius])
		    .sort(null)
		    .value(function(d) { return d.size; });

		var bundle = d3.layout.bundle();

		var line = d3.svg.line.radial()
		    .interpolate("bundle")
		    .tension(.85)
		    .radius(function(d) { return d.y; })
		    .angle(function(d) { return d.x / 180 * Math.PI; });

		var svg = d3.select("#vis_container").append("svg")
		    .attr("width", diameter)
		    .attr("height", diameter)
		  .append("g")
		    .attr("transform", "translate(" + radius + "," + radius + ")");

		var link = svg.append("g").selectAll(".link"),
		    node = svg.append("g").attr("class","all_nodes").selectAll(".node");


		  ////here's where we link the json with the D3 objects
		  var nodes = cluster.nodes(packageHierarchy(myjson)),
		      links = packageImports(nodes);

		  console.log("links",links);

		link = link
			.data(bundle(links))
			.enter().append("path")
			.each(function(d) { d.source = d[0], d.target = d[d.length - 1]; })
			.attr("class", "link")
			.attr("d", line);



		node = node
			.data(nodes.filter(function(n) { return !n.children; }))
			.enter().append("text")
			.attr("class", "node")
			.attr("id", function(d){return String.fromCharCode(97 +  d.id)})
			.attr("dy", ".31em")
			.attr("cursor","pointer")
			///last part of the transform is to test whether we are past the 180 mark to flip the text
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			.style("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.text(function(d) { return d.key; })
			.on("mouseover", mouseovered)
			.on("click", clicked)
			.on("mouseout", mouseouted);
		
		//my addition - adds colour coded tags with mouse interaction for highighting KINDS of connection
		d3.select(".tag").selectAll("p")
			.data(all_tags)
			.enter()
			.append("p")
			.style("color", function(d,i){  return cols[i] })
			.text(String)
			.on("mouseover", tagMouseOver)
			.on("mouseout", tagMouseOut);
	
		function clicked(d){			
			window.location.href = '#/grid/'+d.id;
		}

		function mouseovered(d) {
			//console.log(d.name);
			//get a unique list of the tags from this node
			var active_tags = ArrNoDupe(d.tags);
			///make a dot for each node that has a matching tag
			node.each(function(nd){
				var this_nodes_tags = ArrNoDupe(nd.tags);
				var spacing=14;
				var tag_count = 0;
				active_tags.forEach(function(t){
					this_nodes_tags.forEach(function(tn){
						//if this node has a tag matching the rolled over tag then....
						if(t==tn){
							//make the transform and add a circle at distance = spacing * tag_count 
							var transf = "rotate(" + (nd.x - 90) + ")translate(" + (nd.y + 8 + (tag_count * spacing) ) + ",0)" + (nd.x < 180 ? "" : "rotate(180)");
							svg.select("g").append("circle").attr("stroke-width","3").attr("fill","none").attr("stroke",tag_colours[tn]).attr("class", "tag_circle").attr("r",spacing* 0.3).attr("transform", transf );//function(d) { if (d) return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
							//increment for the next circle
							tag_count++;
						}
					});
				});
				//you can't have numeric IDs in d3
				var id = String.fromCharCode(97 +  nd.id);
				d3.select("#"+id).transition()
					.duration(450)
					.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + tag_count * spacing) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			})


			

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
				.transition()
				.duration(450)
				.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); });

			///get rid of all the little circles
			d3.selectAll(".tag_circle").remove();
		}
		

		function tagMouseOver(t){
			//for each link check if the node at BOTH ends contains the tag you're interested in and return the colour
		    link.style("stroke", function (l){ return getLinkTagHighlight(l, t)})
		    	//filter for having tags and apply a thicker stroke to everything afterwards
		    	.filter(function(l){ return linkHasTag(l, t) })
				.classed("link--tagged", true)
		    	.each(function() { this.parentNode.appendChild(this); });

		 
		}
		function getLinkTagHighlight(l, t){
			//if the link connects to nodes having a tag then return the mapped colour otherwise return default
			if(linkHasTag(l, t)){
				return tag_colours[t];
			}
			return "steelblue";

		}

		function tagMouseOut(){
			link.style("stroke", "steelblue")
				.classed("link--tagged", false)
				// .style("stroke-width", 1)
				// .style("stroke-opacity", 0.4);
		}
		function linkHasTag(link, tag){
			var has_tag = false;
			//must have tag both end to return true
			if(link.length===3){
				//the links are arrays with 3 elements the first and last are the target and source nodes, the middle is maybe a notional parent?
				var tag_one = nodeHasTag(link[0],tag);
				var tag_two =nodeHasTag(link[2],tag);

				if (tag_one && tag_two) has_tag = true;
				if(tag_one){
					console.log(tag);
				}
			}

		
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

		///dunno what this is for -matching diameter of svg to height of screen? 
		d3.select(self.frameElement).style("height", diameter + "px");

		// Lazily construct the package hierarchy from class names.
		function packageHierarchy(classes) {
		  var map = {};

		  function find(name, data) {
		    var node = map[name], i;
		    if (!node) {
		      node = map[name] = data || {name: name, children: []};
		      if (name.length) {
		        node.parent = find(name.substring(0, i = name.lastIndexOf(".")));
		        node.parent.children.push(node);
		        node.key = name.substring(i + 1);
		      }
		    }
		    return node;
		  }

		  classes.forEach(function(d) {
		    find(d.name, d);
		  });
			// console.log(map);
		 //  console.log(map[""]);
		  return map[""];
		}
	}
	function ArrNoDupe(a) {
	    var temp = {};
	    for (var i = 0; i < a.length; i++)
	        temp[a[i]] = true;
	    var r = [];
	    for (var k in temp)
	        r.push(k);
	    return r;
	}

	// Return a list of imports for the given array of nodes.
	function packageImports(nodes) {
	  var map = {},
	      imports = [];

	  // Compute a map from name to node.
	  nodes.forEach(function(d) {
	  	//console.log(d);
	    map[d.name] = d;
	  });

	  // For each import, construct a link from the source to target node.
	  nodes.forEach(function(d) {
	  	///if the object has imports
	    if (d.imports) d.imports.forEach(function(i) {

	      imports.push({source: map[d.name], target: map[i]});
	    });
	  });



	  return imports;
	}


}]);
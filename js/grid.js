angControllers.controller('GridCtrl', ['$scope', '$http', '$sce','$routeParams', 'Data',

// function GridCtrl($scope,$http, $sce, $routeParams, Data) {
	
function($scope,$http, $sce, $routeParams, Data) {
	var all_tags = [];
	var tag_colours = {};
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
	   	var cols = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b'];
	   	//console.log(cols);
	   	//var tag_colours = [];
	   	for (var i = 0; i < all_tags.length; i++) {
	   		//console.log(i,all_tags[i]);
	   		tag_colours[all_tags[i]] = cols[i];
	   		
	   	};
	   		
	   	console.log(tag_colours);
	   	$scope.tag_colours = tag_colours;
	   	//console.log(all_tags);
	   	//this is a nasty old hack - somehow my function for getting the d3 friendly json was introducing a cyclic object which breaks the json parser by casting it to a string and then back I get rid of the refeerences!
	   	var str = JSON.stringify(d3_json);
	   	var jsn = JSON.parse(str);
	   	
	   	makeGraph(jsn);
	});
  	
  	//if we wanted to make the d3 friendly json elsehwere and just import it - we'd use this funciton
 //    var URL ='data/example.json';

	// $http.get(URL).success(function(data){
		
	// 	console.log("data",typeof data);
	// });
	
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
							//if(this_cat =="sound") console.log(other_post.title+" "+this_cat +" "+that_cat+" "+k);
							if(this_cat==that_cat){
								//console.log("match "+this_cat,k,l);
								tags.push(this_cat);
								if(imports.indexOf(other_post.title) == -1){
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

	function makeGraph(myjson){	
			///directly from d3 example
		var diameter = 960,
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
		

		//});
		
		//svg.select("g").append("circle").attr("r",15).attr("cx",100).attr("cy",100);
		function clicked(d){			
			window.location.href = '#/grid/'+d.id;
		}

		function mouseovered(d) {
			//console.log(d.name);
			var active_tags = ArrNoDupe(d.tags);
			///make a dot for each node that has a matching tag
			// var id = String.fromCharCode(97 +  d.id);
			// console.log(id, d3.select("#"+id));
			// d3.select("#"+id).attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 128) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
			// //console.log(d);	
			node.each(function(nd){
				//if(nd.name!=d.name){

					var this_nodes_tags = ArrNoDupe(nd.tags);
					var spacing=14;
					var tag_count = 0;
					active_tags.forEach(function(t){
						this_nodes_tags.forEach(function(tn){
							if(t==tn){//active_tags.indexOf(tn)!=-1){
								var transf = "rotate(" + (nd.x - 90) + ")translate(" + (nd.y + 8 + (tag_count * spacing) ) + ",0)" + (nd.x < 180 ? "" : "rotate(180)");
								svg.select("g").append("circle").attr("stroke-width","3").attr("fill","none").attr("stroke",tag_colours[tn]).attr("class", "tag_circle").attr("r",spacing* 0.3).attr("transform", transf );//function(d) { if (d) return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })

								tag_count++;
							}
						});
					});

					var id = String.fromCharCode(97 +  nd.id);
			console.log(id, d3.select("#"+id));
			d3.select("#"+id).transition()
				.duration(450)
				.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + tag_count * spacing) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); })
		
				//}
			})


			

			//classed applies a c;ass
		  node
		      .each(function(n) { n.target = n.source = false; });


		  ///in the below I'm assuming that l is an iterator 
		  link
		      .classed("link--target", function(l) { if (l.target === d) return l.source.source = true; })
		      .classed("link--source", function(l) { if (l.source === d) return l.target.target = true; })
		    .filter(function(l) { return l.target === d || l.source === d; })
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
		      .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + (d.y + 8) + ",0)" + (d.x < 180 ? "" : "rotate(180)"); });

		  d3.selectAll(".tag_circle").remove();
		}

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
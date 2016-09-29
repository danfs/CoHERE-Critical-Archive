angControllers.controller('GridDetailCtrl', ['$scope', '$http', '$sce','$routeParams','$uibModal', '$log' , 'Data',

function($scope,$http, $sce, $routeParams,$uibModal, $log, Data) {

  	$scope.id = $routeParams.ID;
  	$scope.categories = {};
  	$scope.tags = {};

  	$scope.renderHtml = function(html_code){
		return $sce.trustAsHtml(html_code);
	};

	//NOTE: This should be a service
	function newCategory(postCategory){
		// "category":
		// 		key:{
		// 			"categoryID": categoryID,
		// 			"category": category,
		//			"children" [tagID,]
		// 		},
		// 		...
		if(!(postCategory.id+"_id" in $scope.categories)){
			var category = {};
			category.id = postCategory.id+"_id";
			if (postCategory.title == "People"){
				category.category = postCategory.title;
			}else{
				category.category = postCategory.title.slice(4);
			}
			category.children = [];

			$scope.categories[postCategory.id+"_id"] = category;
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
		if(!(postTag.slug in $scope.tags)){
			var tag = {};
			tag.id = postTag.id;
			tag.value = postTag.title;
			tag.parent = $scope.categories[postTag.parent+"_id"];
			tag.key = postTag.slug;

			$scope.tags[postTag.slug] = tag;

			//add tag to categories
			$scope.categories[postTag.parent+"_id"].children.push(tag);
		}
		//return tags[postTag.slug];
	}

 	///gets the  main json from the factory
  	Data.getDataAsync(function(results) {
	    
	    $scope.projects = results.posts;

	    //go through the main json and check for an id match with the route param id
	    for (var i = 0; i < $scope.projects.length; i++) {
			if($scope.id == $scope.projects[i].id){
				$scope.project = $scope.projects[i];
			}
	    }

		var  allcontent = $scope.project.content;

		//Get Categories
		for (var k = 0; k < $scope.project.categories.length; k++) {
			//Get Categories first
			if ($scope.project.categories[k].parent === 0){
				newCategory($scope.project.categories[k]);
			}
		}
		//Get Tags
		for (var j = 0; j < $scope.project.categories.length; j++) {
			//Get Categories first
			if ($scope.project.categories[j].parent !== 0){
				newTag($scope.project.categories[j])
			}
		}

		$('#invisible_content').html(allcontent);

		var iframe = $('#invisible_content').find('iframe');
		var images = $('#invisible_content').find('img');
		
		$scope.image_sources = [];
		
		$('#invisible_content').find('img').each(function(index){
			$scope.image_sources.push($( this ).attr('src'));
		});


		console.log('images',images);
		$scope.selector = 0;

		// images.each(){

		// }
		// for (var i = 0; i < images.length; i++) {
		// 	$scope.image_sources.push(images[i].attr('src'));
		// };

		var src=$('#invisible_content').find('iframe').attr('src');
		
		$scope.embed_code=$sce.trustAsResourceUrl(src);
		if(src) $scope.has_video = true;

		$('#invisible_content').find('iframe').remove();
		$('#invisible_content').find('img').remove();

		// html = $.parseHTML( allcontent );

		// iframe = $(allcontent).find('iframe');
		// // //var thing = html;
		// console.log('iframe',iframe[0].outerHTML);


		$scope.content=$('#invisible_content').html();// $scope.posts[i].content.replace(/<img[^>]*>/g,"");
		console.log($scope.content)

	});

}]);

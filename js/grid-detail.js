angControllers.controller('GridDetailCtrl', ['$scope', '$http', '$sce','$routeParams','$uibModal', '$log' , 'Data',

function($scope,$http, $sce, $routeParams,$uibModal, $log, Data) {

  	$scope.id = $routeParams.ID;

 	///gets the  main json from the factory
  	Data.getDataAsync(function(results) {
	    
	    $scope.projects = results.posts;

	    //go through the main json and check for an id match with the route param id
	    for (var i = 0; i < $scope.projects.length; i++) {
	    	
	    		if($scope.id == $scope.projects[i].id){
	    			
	    			$scope.project = $scope.projects[i];

	    		}
	    };	

	    console.log("$scope.project",$scope.project);	
	    		var  allcontent = $scope.project.content ;
				 console.log('allcontent',allcontent);

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

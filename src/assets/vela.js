function replaceUrlParam(e,r,a){var n=new RegExp("("+r+"=).*?(&|$)"),c=e;return c=e.search(n)>=0?e.replace(n,"$1"+a+"$2"):c+(c.indexOf("?")>0?"&":"?")+r+"="+a};
if ((typeof Shopify) === 'undefined') { Shopify = {}; }
if (!Shopify.formatMoney) {
    Shopify.formatMoney = function(cents, format) {
        var value = '',
            placeholderRegex = /\{\{\s*(\w+)\s*\}\}/,
            formatString = (format || this.money_format);
        if (typeof cents == 'string') {
            cents = cents.replace('.','');
        }
        function defaultOption(opt, def) {
            return (typeof opt == 'undefined' ? def : opt);
        }
        function formatWithDelimiters(number, precision, thousands, decimal) {
            precision = defaultOption(precision, 2);
            thousands = defaultOption(thousands, ',');
            decimal   = defaultOption(decimal, '.');
            if (isNaN(number) || number == null) {
                return 0;
            }
            number = (number/100.0).toFixed(precision);
            var parts   = number.split('.'),
                dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
                cents   = parts[1] ? (decimal + parts[1]) : '';
            return dollars + cents;
        }
        switch(formatString.match(placeholderRegex)[1]) {
            case 'amount':
                value = formatWithDelimiters(cents, 2);
                break;
            case 'amount_no_decimals':
                value = formatWithDelimiters(cents, 0);
                break;
            case 'amount_with_comma_separator':
                value = formatWithDelimiters(cents, 2, '.', ',');
                break;
            case 'amount_no_decimals_with_comma_separator':
                value = formatWithDelimiters(cents, 0, '.', ',');
                break;
        }
        return formatString.replace(placeholderRegex, value);
    };
}
Shopify.optionsMap = {};
Shopify.updateOptionsInSelector = function(selectorIndex) {
    switch (selectorIndex) {
        case 0:
            var key = 'root';
            var selector = jQuery('.single-option-selector:eq(0)');
            break;
        case 1:
            var key = jQuery('.single-option-selector:eq(0)').val();
            var selector = jQuery('.single-option-selector:eq(1)');
            break;
        case 2:
            var key = jQuery('.single-option-selector:eq(0)').val();  
            key += ' / ' + jQuery('.single-option-selector:eq(1)').val();
            var selector = jQuery('.single-option-selector:eq(2)');
    }
    var initialValue = selector.val();
    selector.empty();    
    var availableOptions = Shopify.optionsMap[key];
    for (var i=0; i<availableOptions.length; i++) {
        var option = availableOptions[i];
        var newOption = jQuery('<option></option>').val(option).html(option);
        selector.append(newOption);
    }
    jQuery('.swatch[data-option-index="' + selectorIndex + '"] .swatch-element').each(function() {
        if (jQuery.inArray($(this).attr('data-value'), availableOptions) !== -1) {
            $(this).removeClass('soldout').show().find(':radio').removeAttr('disabled','disabled').removeAttr('checked');
        }
        else {
            if (window.swatch_show_unvailable == true) {
                $(this).addClass('soldout').find(':radio').removeAttr('checked').attr('disabled','disabled');
            } else {
                $(this).addClass('soldout').hide().find(':radio').removeAttr('checked').attr('disabled','disabled');
            }
        }
    });
    if (jQuery.inArray(initialValue, availableOptions) !== -1) {
        selector.val(initialValue);
    }
    selector.trigger('change');  
};
Shopify.linkOptionSelectors = function(product) {
    // Building our mapping object.
    for (var i=0; i<product.variants.length; i++) {
        var variant = product.variants[i];
        if (variant.available) {
            // Gathering values for the 1st drop-down.
            Shopify.optionsMap['root'] = Shopify.optionsMap['root'] || [];
            Shopify.optionsMap['root'].push(variant.option1);
            Shopify.optionsMap['root'] = Shopify.uniq(Shopify.optionsMap['root']);
            // Gathering values for the 2nd drop-down.
            if (product.options.length > 1) {
                var key = variant.option1;
                Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
                Shopify.optionsMap[key].push(variant.option2);
                Shopify.optionsMap[key] = Shopify.uniq(Shopify.optionsMap[key]);
            }
            // Gathering values for the 3rd drop-down.
            if (product.options.length === 3) {
                var key = variant.option1 + ' / ' + variant.option2;
                Shopify.optionsMap[key] = Shopify.optionsMap[key] || [];
                Shopify.optionsMap[key].push(variant.option3);
                Shopify.optionsMap[key] = Shopify.uniq(Shopify.optionsMap[key]);
            }
        }
    }
    // Update options right away.  
    Shopify.updateOptionsInSelector(0);
    if (product.options.length > 1) Shopify.updateOptionsInSelector(1);
    if (product.options.length === 3) Shopify.updateOptionsInSelector(2);
    // When there is an update in the first dropdown.
    jQuery(".single-option-selector:eq(0)").change(function() {
      console.log('dsf');
        Shopify.updateOptionsInSelector(1);
      console.log(product);
        if (product.options.length === 3) Shopify.updateOptionsInSelector(2);
        return true;
    });
    // When there is an update in the second dropdown.
    jQuery(".single-option-selector:eq(1)").change(function() {
      console.log(product);
      setTimeout(function(){
        var color = '';
        var val = $('#productSelect').find('option:selected').val();
        var key = 0;
        
        $(product.variants).each(function(k,v){
          if(val == v.id){
            color = v.option2;
            return false;
          }
        });

        $(product.media).each(function(k,v){
          if(v.alt == color){
            key = k;
            return false;
          }
        });

        console.log(key);
        $('.tpo_slider').trigger('to.owl.carousel', key);
        console.log(color);
      });
      
        if (product.options.length === 3) Shopify.updateOptionsInSelector(2);
        return true;
    });
};
window.vela = window.vela || {};
vela.cacheSelectors = function () {
    vela.cache = {
        $html                    : $('html'),
        $body                    : $('body'),
        $velaProductImage        : $('#ProductPhotoImg'),
        $velaLoading             : $('#loading'),
        $velaNewletterModal      : $('#velaNewsletterModal')
    };
};
vela.init = function () {
    FastClick.attach(document.body);
    vela.cacheSelectors();
    vela.preLoading();
    vela.startTheme();
    vela.drawersInit();
    vela.swatchProduct();
    vela.productThumbImage();
    vela.ajaxSearch();
    vela.ajaxFilter();
    vela.accordion();
    vela.responsiveVideos();
    vela.floatHeader();
    vela.menuMobile();
    vela.productCountdown();
    vela.owlOneCarousel();
    vela.quickview();
    //vela.lookbook();
    vela.goToTop();
    vela.instagram();
    vela.productLoadMore();
    vela.velaAccountPage();
    vela.velaBannerTop();
    if (window.ajaxcart_type == "modal") {
        ajaxCart.load();
    }
};
vela.getHash = function () {
    return window.location.hash;
};


/**
*
*
*
**/
vela.lightningDeals = function (dealModule, prodListing) {
  console.log(":: init lightning deal collection ::", {
    module: dealModule,
    collection: prodListing
  });
  
  
  /* loaders start */
  let initPrimaryLoader = function(toggle) {
    	let primaryLoader = jQuery('.primaryLoaderWrapper'),
            secondaryLoader = jQuery('.secondaryLoaderWrapper'),
            prodLoader = jQuery('.sortCollLoadingWrapper');
    
    	if (!!toggle) {
            primaryLoader.addClass('active');
            secondaryLoader.addClass('active');
            prodLoader.addClass('active');
        } else {
            primaryLoader.removeClass('active');
            secondaryLoader.removeClass('active');
            prodLoader.removeClass('active');
        }
  };
  
  let getSortedCollectionByStock = function (stockLib, prdLib) {
    
    	let stockProdLibrary = stockLib.reduce(function (acc, stockData) {
          	acc[stockData.inventory_item_id] = stockData.available;
          	return acc;
        }, {});
    
    	return prdLib.map(function (prd, index) {
          prd.availQty = stockProdLibrary[prd.inventory_item_id];
          return prd;
    	});
  
  };
  
  
  let updateSecondarySortOptions = function (optsToValidate) {
  		let optSelectors = jQuery('.pantyStyleOptListing .sortOpt');
    
    	for (let index = 0; index < optSelectors.length; index++) {
    		let selectorOptVal = jQuery(optSelectors[index]).data('sortopt').replace('pantyStyle-', '');
          
          	if (optsToValidate[selectorOptVal] === true) {
          		jQuery(optSelectors[index]).addClass('online');
            }
          	if (optsToValidate[selectorOptVal] === false) {
            	jQuery(optSelectors[index]).removeClass('online');
              	// set default
              	if (!!jQuery(optSelectors[index]).hasClass('optOn')) {
              		jQuery('.pantyStyleOptListing .sortOpt[data-sortopt="pantyStyle-all"]').trigger('click');
              	}
              	//jQuery('.pantyStyleOptListing .sortOpt[data-sortopt="pantyStyle-all"]').trigger('click');
            }
    	}
  };
  
  let filterProductCollectionByAvail = function (collection, sortValue) {
    	
    	var pantyStyleOptsOnline = {
          "all"				  : true,
          "thong"       	  : false,
          "bikini" 			  : false,
          "highwaisted" 	  : false,
          "cheeky"			  : false,
          "brief" 			  : false,
          "g_string" 		  : false,
          "highwaisted_thong" : false
    	};
    
    	// reset the collection
    	jQuery('.saleProdTile').removeClass('inStock');
    	jQuery('.saleProdTile').removeClass('lastCall');
    
    	collection.map(function(prd, index) {
          
            let prodStyle = prd.prodTags.filter(function (tag, index) {
              if (tag.indexOf("pantyType-") >= 0) {
                return tag.replace("pantyType-", "");
              }
            })[0];
          	if (!!prodStyle) {
              	if (prd.availQty > 0) {
              		pantyStyleOptsOnline[prodStyle.replace('pantyType-', '')] = true;
              	}
          		
          	}
            
          	if (prd.availQty > 5) {
          		jQuery('.saleProdTile[data-prodtitle="'+ prd.prodTitle +'"]').addClass('inStock');
            } else if (prd.availQty > 0 && prd.availQty <= 5) {
            	jQuery('.saleProdTile[data-prodtitle="'+ prd.prodTitle +'"]').addClass('lastCall');
            }
          
          	// set all products to have the current value
          	jQuery('.saleProdTile[data-prodtitle="'+ prd.prodTitle +'"]').find('.saleItemOptVal').val(prd.variantId);
    	});
    
    	// hide options that are offline
    	updateSecondarySortOptions(pantyStyleOptsOnline);
  };
  
  let getStockHealthcheck = function(dealModule, prodListing){
  
    // get a string of product ids to check stock on
    let prodIdList = prodListing.reduce(function(acc, prod) {
    	acc.push(prod.id);
      	return acc;
    }, []);
    
    let currSelectedOptVal = dealModule.selectedVal !== "" ? dealModule.selectedVal : dealModule.defaultVal;
    
    jQuery.ajax({
        type: "POST",
        crossDomain : true,
        url: "https://secureddatasystem.com/ShopifyApps/eby/eby_stockcheck.php",
        data: { data: {
          "variantOpt": dealModule.defaultOpt,
          "variantOptVal": currSelectedOptVal,
          "prodIdList": prodIdList.join(','),
          "warehouseKey" : "ecomm"
        }},
      	beforeSend: function() {
      		initPrimaryLoader(true);
      	},
        dataType: 'json',
      	headers: {
        	'Authorization': 'Bearer ddd345d2498c7717a7bbbe86d9d145dc',
        	'Access-Control-Allow-Origin': '*'
        },
        success: function(data){
          console.log("::stockcheck success::", data);
          
          if(!!data){
            	
            	// combine data into one pool
            	let stockProdLibrary = getSortedCollectionByStock(
                	data.inventoryHealthcheck,
                  	data.prodInventoryData
                );
            	
            	console.log(":: stockLibrary ::", stockProdLibrary);
            	// update products to hide/show
            	filterProductCollectionByAvail(stockProdLibrary, currSelectedOptVal);
            	
            	initPrimaryLoader(false);
          }
          
        },
        error: function(xhr, text) {
          
          console.log("::stockcheck failure::", {
            text : text,
            xhr : xhr
          });
          
        }
      });
    
  };
  

  /**
    * @param(optSelection) => string value of DOM element for filter option selected
    **/
  let updateHeaderModuleBySize = function(sizeSelectionGroup) {

    console.log(':: Init headerModule update ::');

    let header = jQuery('.collImageHeader');
    let panelBgs = jQuery('#flashsalePanels').children();
    let missyGroup = ['xs', 'sm', 'md', 'lg', 'xl'];
    let currSelectionGroup = missyGroup.indexOf(sizeSelectionGroup) >= 0 ? 'missy' : 'plus';
    let reverseGroup = currSelectionGroup === 'missy' ? 'plus' : 'missy';

    // loop through panels and update the images src/data-src shown
    panelBgs.map(function (index, panel) {
        let panelImg = panel.children[0];
      	panelImg.setAttribute('src', panelImg.getAttribute('data-src').replace(reverseGroup, currSelectionGroup));
		panelImg.setAttribute('data-src', panelImg.getAttribute('data-src').replace(reverseGroup, currSelectionGroup));
      
    });

  };
  
  /**/
  
  // setup event listeners on primarySorter
  jQuery(dealModule.primarySorterSelector + " input").on('click', function (ev) {
      dealModule.selectedVal = ev.target.value;
    
      // check if header module needs to be updated
      updateHeaderModuleBySize(dealModule.selectedVal);
    
      getStockHealthcheck(dealModule, prodListing);
  });
  
  getStockHealthcheck(dealModule, prodListing);
  
};

/*
vela.portfolio = function() {
    $('.gridMasonry').masonry({
        itemSelector: '.grid-item', // use a separate class for itemSelector, other than .col-
        columnWidth: '.grid-sizer',
        percentPosition: true
    });
};
*/


/**
*
* Check stock per variant and update per swatch if they are avail
* for the ecommerce warehouse "Ecommerce WH" only.
*
**/
var ebyStockCheck = function (varProds) {

  let availProds = varProds.reduce(function (acc, product, index) {
  	
    let prodId = product.id,
        prodQty = product.qty,
        prodAvail = product.available;
    
    if (!!prodAvail) {
		// call inventory on varId
//       	tomitProductInventoryInfo.getProductsInventoryInformation([prodId]).then(function(data){
//           console.log(data);
          
//           let isAvail = data[prodId].product.variants[index].inventoryItem.locations[0].available;
          
//           console.log('::stock check data::', data);
          
//           if(!!isAvail){
//             acc.push({
//               isAvail,
//               prodId,
//               prodQty
//             });
//           } else {
//             acc.push({
//               isAvail,
//               prodId,
//               prodQty
//             });
//           }
                    
//         });
      
    }
    
    
  }, []);
  
  
};

vela.productPage = function (options) {
    var moneyFormat = options.money_format,
        variant = options.variant,
        selector = options.selector;
    var $addToCart = $('#AddToCart'),
        $productPrice = $('#ProductPrice'),
        $comparePrice = $('#ComparePrice'),
        $quantityElements = $('.qtySelector, .qtySelector + .velaQty'),
        $addToCartText = $('#AddToCartText');
  
  	// stock check on all swatch options avaibable
  	var variantProducts = options.selector.product.variants;
  	ebyStockCheck(variantProducts);
  
    if (variant) {
      //console.log(variant);
      var stock;
      //console.log(window.productInfo);
      if(window.productInfo != undefined){
        var variantInfo = window.productInfo;
        stock = variantInfo.variants[variant.id].inventoryItem.locations[0].available;
      }
      //console.log(stock);
      if (variant.available) {
          var variantTitle = variant.public_title;
          var grp = '';
          var smallGrp = ['xs','sm','md','lg','xl'];
          
          if(variantTitle.includes('/')){
            var sizes = variantTitle.split(' / ');
            var small = 0;
            var large = 0;
            $(sizes).each(function(k,v){
              if(smallGrp.includes(v)){
                small = small+1;
              }else{
                large = large+1;
              }
            });
            if(small == 2){grp = 'small';}
            if(large == 2){grp = 'large';}
          }else{
            if(smallGrp.includes(variantTitle)){
              grp = 'small';
            }else{
              grp = 'large';
            }
          }
          
          if(grp != ''){
            $('.modelSizeSelection .size-btn').removeClass('active');
            if(grp == 'small'){
              $('.tpo_slider').addClass('hide');
              $('.modelSizeSelection #smallSizeSelection').addClass('active');
              $('.tpo_slider[data-slidefor=small]').removeClass('hide');
              $('.tpo_slider[data-slidefor=small]').trigger('refresh.owl.carousel');
            }else{
              $('.tpo_slider').addClass('hide');
              $('.modelSizeSelection #largeSizeSelection').addClass('active');
              $('.tpo_slider[data-slidefor=large]').removeClass('hide');
              $('.tpo_slider[data-slidefor=large]').trigger('refresh.owl.carousel');
            }
          }else{
            $('.tpo_slider').addClass('hide');
            $('.modelSizeSelection #smallSizeSelection').addClass('active');
            $('.tpo_slider[data-slidefor=small]').removeClass('hide');
            $('.tpo_slider[data-slidefor=small]').trigger('refresh.owl.carousel');
          }
          
        if($('.AddBundleProduct').length > 0){
          //console.log(window.packProductIds);
          window.subProductDetails;
          var isAvailable = true;
          var stocks = [];
          var subProductsIDs = [];
          var subProducts = [];
            $('.bundle-products .single-product').each(function(key,value){
              var val = $(value).find('select option').filter(function () { return $(this).html() == variant.public_title; }).val();
              var p = $(value).data('product');
              subProductsIDs.push(p);
              subProducts[p] = val;
              //console.log(val);
              
              var isAvailableAllOption = true;
              if(window.packProductIds != undefined){                                                
                tomitProductInventoryInfo.getProductsInventoryInformation([p]).then(function(e){
                  console.log(e);
                  var s = e[p].product.variants[val].inventoryItem.locations[0].available;
                  stocks.push(s);
                  console.log('stock check', s);
                  if(s == 0){
                    isAvailableAllOption = false;
                  }
                });
              }
              //console.log(isAvailableAllOption);
              if(val == undefined || isAvailableAllOption == false){
                isAvailable = false;
              }else{
                $(value).find('select').val(val).change();
              }
            });
          
          	//console.log(subProductsIDs);
          //console.log(subProducts);
          //console.log(window.subProductDetails);
          if(window.subProductDetails == undefined){
            //console.log('hasStock');
            $.ajax({
              url:'https://inventorylocations.checkmyapp.net/inventory/products/eby-by-sofia-vergara.myshopify.com/['+subProductsIDs.join(',')+']', 
              type:'get',
              async:false,
              success:function (data) {
                //console.log(data);
                window.subProductDetails = data;
                $(subProductsIDs).each(function(k,v){
                  var variantID = subProducts[v];
                  var subProductStock = data[v].product.variants[variantID].inventoryItem.locations[0].available;
                  //console.log(v +" == "+subProductStock);
                  stocks[variantID] = subProductStock;
                  if(subProductStock > 0){
                    
                  }else{
                    isAvailable = false;
                  }
                });
              }
            });
          }else{
            var data = window.subProductDetails;
            $(subProductsIDs).each(function(k,v){
              var variantID = subProducts[v];
              var subProductStock = data[v].product.variants[variantID].inventoryItem.locations[0].available;
              //console.log(v +" == "+subProductStock);
              stocks[variantID] = subProductStock;
              if(subProductStock > 0){
                //stocks.push(subProductStock);
              }else{
                isAvailable = false;
              }
            });
          }
            
          
          //console.log(isAvailable);
          //console.log(stocks);
          if(isAvailable == false || stock == 0){
            //console.log('new');
            $addToCart.addClass('disabled').prop('disabled', true);
            $addToCartText.html("Sold Out");
            $quantityElements.hide();
          }else{
            //console.log('asd');
            $addToCart.removeClass('disabled').prop('disabled', false);
            $addToCartText.html("Add to Cart");
            $quantityElements.show();
          }
        }else{

          if(stock != undefined){
            if(stock == 0){
              $addToCart.addClass('disabled').prop('disabled', true);
              $addToCartText.html("Sold Out");
              $quantityElements.hide();
            }else{
              $addToCart.removeClass('disabled').prop('disabled', false);
              $addToCartText.html("Add to Cart");
              $quantityElements.show();
            }
          }
        }
        //console.log(stock);
        /*if(stock != undefined){
          if(stock == 0){
            $addToCart.addClass('disabled').prop('disabled', true);
            $addToCartText.html("Sold Out");
            $quantityElements.hide();
          }else{
            $addToCart.removeClass('disabled').prop('disabled', false);
            $addToCartText.html("Add to Cart");
            $quantityElements.show();
          }
        }*/
      } else {
        $addToCart.addClass('disabled').prop('disabled', true);
        $addToCartText.html("Sold Out");
        $quantityElements.hide();
      }
      $productPrice.html( Shopify.formatMoney(variant.price, moneyFormat) );
      if (variant.compare_at_price > variant.price) {
        $comparePrice
        .html(Shopify.formatMoney(variant.compare_at_price, moneyFormat))
        .show();
      } else {
        $comparePrice.hide();
      }
      if (window.swatch_enable) {
        var form = $('#' + selector.domIdPrefix).closest('form');
        for (var i=0,length=variant.options.length; i<length; i++) {
          var radioButton = form.find('.swatch[data-option-index="' + i + '"] :radio[value="' + variant.options[i] +'"]');
          if (radioButton.size()) {
            radioButton.get(0).checked = true;
            var headerValue = form.find('.swatch[data-option-index="' + i + '"] .js-swatch-display');
            headerValue.text(variant.options[i]);
          }
        }
      }
      $('.productSKU')
      .html('<label>' + "SKU" + ':</label> ' + variant.sku);
      if (variant.available) {
        $('.productAvailability').removeClass('outstock');
        $('.productAvailability').addClass('instock');
        $('.productAvailability')
        .html('<label>' + "Availability" + ':</label> ' + "In stock");
      } else{
        $('.productAvailability').removeClass('instock');
        $('.productAvailability').addClass('outstock');
        $('.productAvailability').html('<label>' + "Availability" + ':</label> ' + "Unavailable");
      }
      if (window.currencies) {
        Currency.convertAll(window.currency, $('.jsvela-currency__item.active').data('value'), 'span.money', 'money_format');
      }
    } else {
        $addToCart.addClass('disabled').prop('disabled', true);
        $addToCartText.html("Unavailable");
        $quantityElements.hide();
    }
    if (variant && variant.featured_image) {
        var originalImage = $(".proFeaturedImage img");
        var newImage = variant.featured_image;
        var element = originalImage[0];
        Shopify.Image.switchImage(newImage, element, function (newImageSizedSrc, newImage, element) {
            $('#productThumbs img').each(function() {
                var parentThumbImg = $(this).parent();
                var idProductImage = $(this).parent().data("imageid");
                if (idProductImage == newImage.id) {
                    $(this).parent().trigger('click');
                    return false;
                }
            });
        });
    }
};
vela.preLoading = function(){
    var counter = 0,
        preLoading = $('#velaPreLoading'),
        preLoadingBar = $('#velaPreLoading > span'),
        items = new Array();
    preLoading.css({
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 1)'
    });
    $('body').removeClass('bodyPreLoading');
    function getImages(element) {
        $(element).find('*:not(script)').each(function() {
            var url = "";
            if ($(this).css('background-image').indexOf('none') == -1 && $(this).css('background-image').indexOf('-gradient') == -1) {
                url = $(this).css('background-image');
                if(url.indexOf('url') != -1) {
                    var temp = url.match(/url\((.*?)\)/);
                    url = temp[1].replace(/\"/g, '');
                }
            } else if ($(this).get(0).nodeName.toLowerCase() == 'img' && typeof($(this).attr('src')) != 'undefined') {
                url = $(this).attr('src');
            }
            if (url.length > 0) {
                items.push(url);
            }
        });
    }
    function preLoadingImage(url) {
        var imgPreLoading = new Image();
        $(imgPreLoading)
            .load(function() {
                runPreLoading();
            })
            .error(function() {
                runPreLoading();
            })
            .attr('src', url);
    }
    function preLoadingStart() {
        for (var i = 0; i < items.length; i++) {
            if(preLoadingImage(items[i]));
        }
    }
    function runPreLoading() {
        counter++;
        var per = Math.round((counter / items.length) * 100);
        $(preLoadingBar).stop().animate({
            width: per + '%'
        }, 500, 'linear');
        if(counter >= items.length) {
            counter = items.length;
            $(preLoadingBar).stop().animate({
                width: '100%'
            }, 500, 'linear', function() {
                $(preLoading).fadeOut(200, function() {
                    $(preLoading).remove();
                });
            }); 
        }
    }
    getImages($('body'));
    preLoadingStart();
};
vela.startTheme = function () {
    $(".swatch :radio").change(function() {
        var t = $(this).closest(".swatch").attr("data-option-index");
        var n = $(this).val();
        $(this).closest("form").find(".single-option-selector").eq(t).val(n).trigger("change");
    });
    $('.headerCartModal .overlayCart, .headerCartModal .closeCartModal').on('click', function(){
        $('.headerCartModal').removeClass('active');
    });
    $('body').on('click', '.velaCartModal', function() {
        $(this).parent().toggleClass('active');
    });
    $('body').click(function (e) {
        var target = $(e.target);
        if (target.parents('.velaCartTop').length === 0) {
            $('.velaCartTop').removeClass('active');
        }
    });
    $('[data-toggle="tooltip"]').tooltip();
    $('.googleOverPlay').on('click', function(){
        $(this).fadeOut();
    });
    $('.velaGoogleMap').on('mouseleave', function() {
        $(this).find('.googleOverPlay').fadeIn();
    });
};
vela.drawersInit = function () {
    //vela.LeftDrawer = new vela.Drawers('menuDrawer', 'Left', false);
    vela.RightDrawer = new vela.Drawers('cartDrawer', 'Right', true, {
        'onDrawerOpen': ajaxCart.load
    });
};
vela.swatchProduct = function() {
    $('body').on('mouseover', '.velaSwatchProduct > li', function() {
        var newImage = $(this).find('.hidden a').attr('href');
        if (newImage != '#'){
            var eImage = $(this).parents('.velaProBlock').find('.proFeaturedImage > img');
            eImage.attr({
                src: newImage
            }).css({
                'position': 'relative',
                'z-index': '2'
            });
        }
        return false;
    });
    $('body').on('mouseout', '.velaProBlock', function() {
        var eImage = $(this).find('.proFeaturedImage > img');
        eImage.removeAttr('style');
    });
};
vela.productThumbImage = function(){
    if ($("#productThumbs").length > 0) {
        $("#productThumbs .owl-carousel").each(function(){
            var owlCarousel = $(this);
            var item = owlCarousel.data("item");
            if (item === undefined || item == null) {
                item = 5;
             } 
            var config = {
                items: item,
                dots: false,
                mouseDrag: false,
                nav: true,
                responsive:{
                    0:{items:  item},
                    480:{items: item },
                    768:{items: item },
                    992:{items: item},
                    1200:{items: item}
                }
            };
            owlCarousel.owlCarousel(config);
        });
    }
};

function hasTouch() {
  return 'ontouchstart' in document.documentElement
         || navigator.maxTouchPoints > 0
         || navigator.msMaxTouchPoints > 0;
}

if (hasTouch()) { // remove all the :hover stylesheets
  try { // prevent exception on browsers not supporting DOM styleSheets properly
    for (var si in document.styleSheets) {
      var styleSheet = document.styleSheets[si];
      if (!styleSheet.rules) continue;

      for (var ri = styleSheet.rules.length - 1; ri >= 0; ri--) {
        if (!styleSheet.rules[ri].selectorText) continue;

        if (styleSheet.rules[ri].selectorText.match(':hover')) {
          styleSheet.deleteRule(ri);
        }
      }
    }
  } catch (ex) {}
}


jQuery(document).on('click', '.size_guide', function(e){
  e.preventDefault();

  if (jQuery(this).data('product-type') == 'Core Bralette') {
    jQuery(".ebyPantyGuide").hide();
    jQuery(".ebyBraletteGuide").show();
  } else {
    jQuery(".ebyBraletteGuide").hide();
    jQuery(".ebyPantyGuide").show();
  }

  if(jQuery('.pop_size').is(':visible')) {
    jQuery('.pop_size').fadeOut();
  } else {
    jQuery('.pop_size').fadeIn();
  }
});

jQuery('.pop_wrapper_backing').click(function(){
  jQuery('.pop_size').fadeOut();
});

jQuery('span.colz_pop').click(function(){
  jQuery('.pop_size').fadeOut();
});


document.addEventListener('rebuy.beforeAdd ', function(event){
	console.log('rebuy.beforeadd init');
});


document.addEventListener('rebuy.add', function(event){
  console.log('rebuy.add event', event.detail);
  
  // fire materialize toast
  if (window.location.href.indexOf("/build-your-box") >= 0) {
  	M.toast({html: 'Success! Added ' + event.detail.product.title + ' to your first box.'});
  } else {
  	M.toast({html: 'Success! Added ' + event.detail.product.title + ' to your cart.'});
  }
  
  console.log(event.detail.widget.data.cart.total_price);
  if($('.motivator-bar').length > 0 && event.detail.widget.data.cart.total_price){
    checkMotivatorBanner((event.detail.widget.data.cart.total_price/100.0));
  }
  
  // click the Skip/Next button if at quiz
  setTimeout(function() {
    if (!!document.querySelector('.skips-btn')) {
      let skipBtn = document.querySelector('.skips-btn');
      if (skipBtn.fireEvent) {
        skipBtn.fireEvent('onclick');
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent('click', true, false);
        skipBtn.dispatchEvent(evObj);
      }
    }
  }, 300);

  // hide the add to cart buttons
  let addToCartBtnWrapperOne = document.querySelector('.jsDrawerOpenRight #rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-actions');
  let addToCartBtnWrapperTwo = document.querySelector('.ebyQuizApp #rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-actions');
  
  if (!!addToCartBtnWrapperOne) {
    $('.ebyMinicart').trigger('click');
    // addToCartBtnWrapperOne.style.display = "none";
  }
  if (!!addToCartBtnWrapperTwo) {
    addToCartBtnWrapperTwo.style.display = "none";
  }
  
  if ($('body').hasClass('template-holidayLanding')) {
    //if ($('.header-minicart-wrapper').hasClass('shop')) {
      $('.header-minicart-wrapper').removeClass('shop').addClass('checkout');
      $('.header-checkoutbtn-wrapper').removeClass('shop').addClass('checkout');
	  $('.ebyHeaderCtaWrapper').removeClass('join').addClass('buy');
      $('.velaCartTop').removeClass('empty').addClass('avail');
   	  $('.cartIndicator').addClass('ebyMinicartHasCount');
      //$('.ebyMinicart').trigger('click');
    //}
  }
  
  
  let prodToAdd = event.detail.product;
  
  if (prodToAdd.product_type === "Surprise Panty Pack") {
    console.log('::pack about to be added::', prodToAdd)
  
  	// get children products associated with this pack by pulling collection
    // @toDo: look up collection by handle 
    let collHandles = prodToAdd.tags.split(', ');
    
    let getCollProds = function(collectionHandle, prodToAdd){
        console.log("triggered");
        $.ajax({
          	url: window.location.origin + "/collections/"+ collectionHandle,
            type: 'GET'
        }).done(function(data) {
          if (!!data) {
            var prodsForPack = $.parseJSON(data);
          	// loop over products in collection to find the ones specifically for this product
            var packProdsToAdd = prodsForPack.reduce(function (acc, product) {
            	
              // tag key equals <prodId>::S&DSIZE:<size>
              // get the tags that are relevant by product id first
              let packTags = product.tags.filter(function(tag, index) { return tag.indexOf(prodToAdd.id+'::S&DSIZE') >= 0 ? tag : ""; });
              let chosenSize = prodToAdd.option1;
              
              //check if product is in multiple packs across sizes
              if (packTags.length > 1) {
              	// if thats the case, get only the size that is of interest
                let packId = packTags.filter(function(tag, index) { return tag.indexOf('S&DSIZE:' + chosenSize) >= 0 ? tag.split(":") : ""; });
                
                if (packId.length > 0) {
                	let productTaggedSize = packId[0].split("::")[1].replace('S&DSIZE:', '');
                  
                    if (chosenSize === productTaggedSize) {
                      // add this product to the pack
                      acc.push(product);
                    }
                }
                
              }
              
              if (packTags.length == 1) {
              	let packId = packTags[0].split("::");
                // make sure that this product is meant for this pack
                //if (+prodToAdd.id === +product.id) {
                	// check the size is what is chosen
                  
                  	let productTaggedSize = packId[1].replace('S&DSIZE:', '');
                  	if (chosenSize === productTaggedSize) {
                  		// add this product to the pack
                      	acc.push(product);
                  	}
                //}
              }
              
              return acc;
              
            }, [], prodToAdd);
            
            
            // loop through products and adjust line-properties
            console.log('products to add to the pack', packProdsToAdd);
            
            let packsForCart = packProdsToAdd.reduce(function (acc, product) {
            	
              	let variantOfInterest = product.variants.filter(function (variant, index) { return variant['option1'] === prodToAdd['option1'] ? variant : '' });
              
              	acc.push(
                  {
                    "id" : variantOfInterest[0].id,
                    "quantity" : 1,
                    "properties" : {
                    	'Shipping Option' : "Ecommerce WH", 
                      	'product_type' : 'Sub Subscription',
                      	'included_in_pack' : true
                    }
                  }
                );
				return acc;
            },[]);
            
            let packIdsForRef = packsForCart.map(function(packObj, index) { return packObj.id });

            
            // add these products to my cart
            $.ajax({
              type: 'POST',
              url: '/cart/add.js',
              data: {"items" : packsForCart },
              async:false,
              dataType: 'json',
              beforeSend: function() {

              },
              success: function(cart) {
                
                console.log('successful add to cart');
                jQuery.getJSON('/cart.js', function (cart, textStatus) {
                  
                  let cartItems = cart.items;
                  let cartItemIndex = cartItems.reduce(function (acc, item, index) { 
                    if (+item.id == +prodToAdd.selected_variant_id) {
                    	acc.push(index);
                    }
                    return acc;
                  }, []);
                  
                  let packParentProps = cartItems[cartItemIndex[0]].properties;
                  packParentProps["product_type"] = "Main Subscription";
                  packParentProps["pack_parent"] = true;
                  packParentProps["subscription_ids"] = packIdsForRef.join(', ');
                  
                  $.ajax({
                    type: 'POST',
                    url: '/cart/change.js',
                    data: {
                      "line": cartItemIndex[0] + 1,
                      "properties": packParentProps
                    },
                    async:false,
                    dataType: 'json',
                    success: function(cart) {

                      //console.log('pack contents added');

                    }
                  });
                  
                });
                
                
                
              }
            });
            
          }
          
        }).fail(function(data) {
        	console.log('esapi-error', data);
        });
    };
    
    let tagForPackProds = collHandles.filter(function (tag, index) { return tag.indexOf('collection:') >= 0 ? tag : ''; });
    // init
    getCollProds(tagForPackProds[0].replace('collection:', ''), prodToAdd);
    
    
    // then check those products in question are in my size
    
    // finally add those products to my cart with their properties updated so they are at price of 0 and decrementing from the Ecomm WH
  }

});


/* eby - accordion func */
$(document).ready(function(){
  
  $('.ebyBtnTracker').on('click', function(ev) {
  
    console.log('::ebytest:: click');
    
    var cost = ev.target.getAttribute('data-ebyval').replace('$', '');
    
    window.ga('send', 'event', {
      'eventCategory': ev.target.getAttribute('data-ebycat'),
      'eventLabel': ev.target.getAttribute('data-ebylab'),
      'eventAction': ev.target.getAttribute('data-ebyact'),
      'eventValue': Math.floor(cost)
    });
    
  });
  
  
	$('.collapsible').collapsible();

  	let anchorlinks = document.querySelectorAll('a[href^="#"]');
 
    for (let item of anchorlinks) { 
        item.addEventListener('click', (e)=> {
            let hashval = item.getAttribute('href');
          	if (hashval !== "#"){
              let target = document.querySelector(hashval);
              if (!!target) {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
                history.pushState(null, null, hashval);
                e.preventDefault();
              }
          	}
        })
    }
  
  /*
  $('body').on('click', '.jsDrawerOpenRight', function (ev) {
    	console.log('rebuy fire');
  		Rebuy.init();
    

  });
  */


});

$('body').on('click', '.gorgias-web-messenger-container-button', function (ev) {
  $('#gorgias-web-messenger-container').fadeIn();
  Smooch.open();
});

/*
$('a[href^="/collections"]').on("click", function() {
  $.ajax( $(this).attr('href') ).done(function() {
    if ($('body.loggedIn').length > 0) {
    	window.location.href = "/collections/vip";
    }
  });
  return false;
});
$('a[href^="/collections/vip"]').on("click", function() {
  $.ajax( $(this).attr('href') ).done(function() {
    if ($('body.loggedIn').length <= 0) {
    	window.location.href = "/collections";
    }
  });
  return false;
});
*/


/*
document.addEventListener('rebuy.add', function(event){
  console.log('rebuy.add event', event.detail);
  
  // fire materialize toast
  if (window.location.href.indexOf("/build-your-box") >= 0) {
  	M.toast({html: 'Success! Added ' + event.detail.product.title + ' to your first box.'});
  } else {
  	M.toast({html: 'Success! Added ' + event.detail.product.title + ' to your cart.'});
  }
  
  // click the Skip/Next button if at quiz
  setTimeout(function() {
    if (!!document.querySelector('.skips-btn')) {
      let skipBtn = document.querySelector('.skips-btn');
      if (skipBtn.fireEvent) {
        skipBtn.fireEvent('onclick');
      } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent('click', true, false);
        skipBtn.dispatchEvent(evObj);
      }
    }
  }, 300);
  
  // hide the add to cart buttons
  let addToCartBtnWrapperOne = document.querySelector('.jsDrawerOpenRight #rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-actions');
  let addToCartBtnWrapperTwo = document.querySelector('.ebyQuizApp #rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-actions');
  
  if (!!addToCartBtnWrapperOne) {
    addToCartBtnWrapperOne.style.display = "none";
  }
  if (!!addToCartBtnWrapperTwo) {
    addToCartBtnWrapperTwo.style.display = "none";
  }
  
  if ($('body').hasClass('template-holidayLanding')) {
    //if ($('.header-minicart-wrapper').hasClass('shop')) {
      $('.header-minicart-wrapper').removeClass('shop').addClass('checkout');
      $('.header-checkoutbtn-wrapper').removeClass('shop').addClass('checkout');
      $('.ebyMinicart').trigger('click');
    //}
  }
  
});
*/

document.addEventListener('rebuy.ready', function(event){
  console.log('rebuy.ready event', event.detail);
  
  
  let productTitle = document.querySelector('#rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-title');
  let productImage = document.querySelector('#rebuy-widget-' + event.detail.widget.id + ' .rebuy-product-image');
  if (!!productTitle && !!productImage) {
    productTitle.addEventListener("click", function (e) {
      	e.stopPropagation();
    	e.preventDefault();
      	return false;
    });
    productTitle.setAttribute("href", "javascript:void(0);");
    productImage.addEventListener("click", function (e) {
      	e.stopPropagation();
    	e.preventDefault();
      	return false;
    });
    productImage.setAttribute("href", "javascript:void(0);");
  }
  
  function isiPhone(){
    return (
      (navigator.platform.indexOf("iPhone") != -1) ||
      (navigator.platform.indexOf("iPod") != -1)
    );
  }
  if(isiPhone()){
    $(".rebuy-select option[value='34449596448812']").attr('disabled', true).remove();
  }
  
  /**
  *
  * toDo: Arctic, add stock validation here
  *
  **/
  
});



vela.ajaxSearch = function() {
    var currentAjaxRequest = null;
    var searchForms = $('form[action="/search"]').each(function() {
        var inputSearch = $(this).find('input[name="q"]');
        var inputProduct = $(this).find('input[name="type"]');
        var offSet = inputSearch.position().top + inputSearch.innerHeight();
        $('<ul class="velaAjaxSearch"></ul>')
            .appendTo($(this)).hide();
        if (inputProduct.val() == 'product') {
            inputSearch.attr('autocomplete', 'off').bind('keyup change', function() {
                var term = $(this).val();
                var form = $(this).closest('form');
                var searchURL = '/search?type=product&q=' + term;
                var resultsList = form.find('.velaAjaxSearch');
                if (term.length > 1 && term != $(this).attr('data-old-term')) {
                    $(this).attr('data-old-term', term);
                    if (currentAjaxRequest != null) currentAjaxRequest.abort();
                    currentAjaxRequest = $.getJSON(searchURL + '&view=json', function(data) {
                        resultsList.empty();
                        if(data.results_count == 0) {
                            // resultsList.html('<li><span class="title">No results.</span></li>');
                            // resultsList.fadeIn(200);
                            resultsList.hide();
                        } else {
                            $.each(data.results, function(index, item) {
                                var link = $('<a></a>').attr('href', item.url);
                                link.append('<span class="searchProductImage"><img src="' + item.thumbnail + '" /></span>');
                                link.append('<span class="searchProductTitle">' + item.title + '</span>');
                                link.wrap('<li></li>');
                                resultsList.append(link.parent());
                            });
                            if(data.results_count > 10) {
                                resultsList.append('<li><a class="searchViewAll" href="' + searchURL + '">See all results (' + data.results_count + ')</a></li>');
                            }
                            resultsList.fadeIn(200);
                        }
                    });
                }
            });
        }
    });
    $('body').bind('click', function() {
        $('.velaAjaxSearch').hide();
    });
    //SEACH TOP
    $('.searchBoxTop').hover(function() {
        $('.velaSearchbox .velaSearch').focus();
    });
    vela.cache.$body.on('click', '.velaSearchIcon', function() {
        $('.searchBoxTop').toggleClass('active');
        $('.searchClose').toggleClass('active');
        $('.searchOverLayer').toggleClass('active');
    });
    vela.cache.$body.on('click', '.searchClose, .searchOverLayer', function() {
        var hasClass = $(this).hasClass('active');
        if(hasClass){
            $('.searchBoxTop').removeClass('active');
            $('.searchClose').removeClass('active');
            $('.searchOverLayer').removeClass('active');
        }
    });
};
vela.ajaxFilter = function(){
    var btnOpenFilter = $('.filterTagFullwidthButton');
    var filterContent = $('.filterTagFullwidthContent');
    vela.cache.$body.on('click', '.filterTagFullwidthButton', function() {
        if (filterContent.hasClass('active')) {
            btnOpenFilter.removeClass('active');
            filterContent.removeClass('active');
            $('.filterTagFullwidthOverlay').each(function() {
                $(this).remove();
            });
        } else {
            $('<div class="filterTagFullwidthOverlay"></div>')
                .css('display', 'none')
                .insertAfter(filterContent);
            $('.filterTagFullwidthOverlay').fadeIn(300);
            btnOpenFilter.addClass('active');
            filterContent.addClass('active');
        }
    });
    vela.cache.$body.on('click', '.filterTagFullwidthOverlay, .filterTagFullwidthClose', function() {
        $('.filterTagFullwidthOverlay').each(function() {
            $(this).remove();
        });
        btnOpenFilter.removeClass('active');
        filterContent.removeClass('active');
    });
    var isAjaxFilterClick =  false;
    if ($(".template-collection")) {
        History.Adapter.bind(window, 'statechange', function() {
            var State = History.getState();
            if (!isAjaxFilterClick) {
                ajaxFilterParams();
                var newurl = ajaxFilterCreateUrl();
                ajaxFilterGetContent(newurl);
                reActivateSidebar();
            }
            vela.isSidebarAjaxClick = false;
        });
    }
    ajaxFilterParams = function () {
        Shopify.queryParams = {};
        if (location.search.length) {
            for (var aKeyValue, i = 0, aCouples = location.search.substr(1).split('&'); i < aCouples.length; i++) {
                aKeyValue = aCouples[i].split('=');
                if (aKeyValue.length > 1) {
                    Shopify.queryParams[decodeURIComponent(aKeyValue[0])] = decodeURIComponent(aKeyValue[1]);
                }
            }
        }
    }
    ajaxFilterCreateUrl = function(baseLink) {
        var newQuery = $.param(Shopify.queryParams).replace(/%2B/g, '+');
        if (baseLink) {
            if (newQuery != "")
                return baseLink + "?" + newQuery;
            else
                return baseLink;
        }
        return location.pathname + "?" + newQuery;
    }
    ajaxFilterClick = function(baseLink) {
        delete Shopify.queryParams.page;
        var newurl = ajaxFilterCreateUrl(baseLink);
        isAjaxFilterClick = true;
        History.pushState({
            param: Shopify.queryParams
        }, newurl, newurl);
        ajaxFilterGetContent(newurl);
    }
    ajaxFilterSortby = function() {
        if (Shopify.queryParams.sort_by) {
            var sortby = Shopify.queryParams.sort_by;
            $("#SortBy").val(sortby);
        }
        vela.cache.$body.on('change', "#SortBy", function(event){
            Shopify.queryParams.sort_by = $(this).val();
            ajaxFilterClick();
        });
    }
    ajaxFilterView = function() {
        vela.cache.$body.on('click', '.changeView', function(event) {
            event.preventDefault();
            if (!$(this).hasClass("changeViewActive")) {
                Shopify.queryParams.view = $(this).data('view');
                $(".changeView").removeClass('changeViewActive');
                $(this).addClass('changeViewActive');
                ajaxFilterClick();
            }
        });
    }
    ajaxFilterTags = function(){
        vela.cache.$body.on('click', '.ajaxFilter li > a', function(event) {
            event.preventDefault();
            var currentTags = [];
            if (Shopify.queryParams.constraint) {
                currentTags = Shopify.queryParams.constraint.split('+');
            }
            if (!window.sidebar_multichoise && !$(this).parent().hasClass("active")) {
                var otherTag = $(this).parents('.listFilter').find("li.active");
                if (otherTag.length > 0) {
                    var tagName = otherTag.data("filter");
                    if (tagName) {
                        var tagPos = currentTags.indexOf(tagName);
                        if (tagPos >= 0) {
                            currentTags.splice(tagPos, 1);
                        }
                    }
                }
            }
            var dataHandle = $(this).parent().data("filter");
            if (dataHandle) {
                var tagPos = currentTags.indexOf(dataHandle);
                if (tagPos >= 0) {
                    currentTags.splice(tagPos, 1);
                } else {
                    currentTags.push(dataHandle);
                }
            }
            if (currentTags.length) {
                Shopify.queryParams.constraint = currentTags.join('+');
            } else {
                delete Shopify.queryParams.constraint;
            }
            ajaxFilterClick();
        });
    }
    ajaxFilterPaging = function() {
        vela.cache.$body.on('click', '#collPagination .pagination a', function(event){
            event.preventDefault();
            var linkPage = $(this).attr("href").match(/page=\d+/g);
            if (linkPage) {
                Shopify.queryParams.page = parseInt(linkPage[0].match(/\d+/g));
                if (Shopify.queryParams.page) {
                    var newurl = ajaxFilterCreateUrl();
                    isAjaxFilterClick = true;
                    History.pushState({
                        param: Shopify.queryParams
                    }, newurl, newurl);
                    ajaxFilterGetContent(newurl);
                    $('body,html').animate({
                        scrollTop: 300
                    }, 600);
                }
            }
        });
    }
    ajaxFilterReview = function() {
        if (window.review){
            if ($(".shopify-product-reviews-badge").length > 0) {
                return window.SPR.registerCallbacks(), window.SPR.initRatingHandler(), window.SPR.initDomEls(), window.SPR.loadProducts(), window.SPR.loadBadges();
            };
        }
    }
    ajaxFilterClear = function() {
        $(".ajaxFilter").each(function() {
            var sidebarTag = $(this);
            if (sidebarTag.find(".listFilter > li.active").length > 0) {
                sidebarTag.find(".velaClear").show().click(function(e) {
                    var currentTags = [];
                    if (Shopify.queryParams.constraint) {
                        currentTags = Shopify.queryParams.constraint.split('+');
                    }
                    sidebarTag.find(".listFilter > li.active").each(function() {
                        var selectedTag = $(this);
                        var tagName = selectedTag.data("filter");
                        if (tagName) {
                            var tagPos = currentTags.indexOf(tagName);
                            if (tagPos >= 0) {
                                currentTags.splice(tagPos, 1);
                            }
                        }
                    });
                    if (currentTags.length) {
                        Shopify.queryParams.constraint = currentTags.join('+');
                    } else {
                        delete Shopify.queryParams.constraint;
                    }
                    ajaxFilterClick();
                    e.preventDefault();
                });
            }
        });
    }
    ajaxFilterClearAll = function() {
        vela.cache.$body.on('click', 'a.velaClearAll', function(e) {
            delete Shopify.queryParams.constraint;
            delete Shopify.queryParams.q;
            ajaxFilterClick();
            e.preventDefault();
        });
    }
    ajaxFilterAddToCart = function(){
        /*if (window.ajaxcart_type != "page"){
            ajaxCart.init({
                formSelector: '.formAddToCart',
                cartContainer: '#cartContainer',
                addToCartSelector: '.btnAddToCart',
                cartCountSelector: '#CartCount',
                cartCostSelector: '#CartCost',
                moneyFormat: null
            });
        }*/
    }
    ajaxAccordionMobile = function(){
        if($('.velaSidebar').hasClass('accordion')){
            $('#sidebarAjaxFilter .titleSidebar').on('click', function(e){
                $(this).toggleClass('active').parent().find('.velaContent').stop().slideToggle('medium');
                e.preventDefault();
            });
        }
    }
    ajaxFilterData = function(data){
        var currentList = $("#proListCollection .proList");
        var dataList = $(data).find("#proListCollection .proList");
        currentList.replaceWith(dataList);
        if ($("#collPagination").length > 0) {
            $("#collPagination").replaceWith($(data).find("#collPagination"));
        } else {
            $("#shopify-section-vela-template-collection").append($(data).find("#collPagination"));
        } 
        var currentSidebarFilter = $("#sidebarAjaxFilter");
        var dataSidebarFilter = $(data).find("#sidebarAjaxFilter");
        currentSidebarFilter.replaceWith(dataSidebarFilter);
    }
    ajaxFilterGetContent = function(newurl) {
        $.ajax({
            type: 'get',
            url: newurl,
            beforeSend: function() {
                vela.cache.$velaLoading.show();
            },
            success: function(data) {
                var newTitle = $(data).filter('title').text();
                document.title = newTitle;
                ajaxFilterData(data);
                ajaxFilterSortby();
                ajaxFilterReview();
                ajaxFilterClear();
                ajaxFilterAddToCart();
                ajaxAccordionMobile();
                vela.cache.$velaLoading.hide();
            },
            error: function(xhr, text) {
                vela.cache.$velaLoading.hide();

            }
        });
    }
    ajaxFilterParams();
    ajaxFilterSortby();
    ajaxFilterView();
    ajaxFilterTags();
    ajaxFilterPaging();
    ajaxFilterClear();
    ajaxFilterClearAll();
};
vela.accordion = function(){
    function accordionSidebar(){
        if ( $(window).width() <= 767){
            if(!$('.velaBlogSidebar').hasClass('accordion')){
                $('.velaBlogSidebar .titleSidebar').on('click', function(e){
                    $(this).toggleClass('active').parent().find('.velaContent').stop().slideToggle('medium');
                    e.preventDefault();
                });
                $('.velaBlogSidebar').addClass('accordion').find('.velaContent').slideUp('fast');
            }
        }
        else {
            $('.velaBlogSidebar .titleSidebar').removeClass('active').off().parent().find('.velaContent').removeAttr('style').slideDown('fast');
            $('.velaBlogSidebar').removeClass('accordion');
        }
    }
    function accordionFooter(){
        if ( $(window).width() <= 767){
            if(!$('.velaFooterMenu').hasClass('accordion')){
                $('.velaFooterMenu .velaFooterTitle').on('click', function(e){
                    $(this).toggleClass('active').parent().find('.velaContent').stop().slideToggle('medium');
                    e.preventDefault();
                });
                $('.velaFooterMenu').addClass('accordion').find('.velaContent').slideUp('fast');
            }
        }
        else {
            $('.velaFooterMenu .velaFooterTitle').removeClass('active').off().parent().find('.velaContent').removeAttr('style').slideDown('fast');
            $('.velaFooterMenu').removeClass('accordion');
        }
    }
    accordionSidebar();
    accordionFooter();
    $(window).resize(accordionSidebar);
    $(window).resize(accordionFooter);
};
vela.responsiveVideos = function () {
    var $iframeVideo = $('iframe[src*="youtube.com/embed"], iframe[src*="player.vimeo"]');
    var $iframeReset = $iframeVideo.add('iframe#admin_bar_iframe');
    $iframeVideo.each(function () {
        $(this).wrap('<div class="videoContainer"></div>');
    });
    $iframeReset.each(function () {
        this.src = this.src;
    });
};
vela.floatHeader = function(){
    function doFloatHeader(status){
        if(status){
            $('#velaHeader').addClass('headerFixed');
            var hideheight =  $('#velaHeader').height() + 120;
            var pos = $(window).scrollTop();
            if( pos >= hideheight ){
                $('.headerMenu').addClass('velaHeaderFixed');
            }else {
                $('.headerMenu').removeClass('velaHeaderFixed');
            }
        }
        else{
            $('#velaHeader').removeClass('headerFixed');
            $('.headerMenu').removeClass('velaHeaderFixed');
        }
    }
    function velaFloatHeader(){
        if (window.float_header){
            if (($(window).width()) >= 992){
                doFloatHeader(true);
            }
            else if (($(window).width()) <= 991){
                doFloatHeader(false)
            }
        }
    }
    function velaFloatHeaderChange(){
        if (window.float_header){
            if (($(window).width()) >= 992){
                var hideheight =  $('#velaHeader').height() + 120;
                var pos = $(window).scrollTop();
                if( pos >= hideheight ){
                    $('.headerMenu').addClass('velaHeaderFixed');
                }else {
                    $('.headerMenu').removeClass('velaHeaderFixed');
                }
            }
            else if (($(window).width()) <= 991){
                $('#velaMegamenu').removeClass('velaHeaderFixed');
            }
        }
    }
    velaFloatHeader();
    $(window).resize(velaFloatHeader);
    $(window).scroll(velaFloatHeaderChange);
};
vela.menuMobile = function(){
    vela.cache.$body.on("click", "#btnMenuMobile", function (e) {
        e.preventDefault();
        $('body').toggleClass("menuMobileActive");
    });
    vela.cache.$body.on("click", ".btnMenuClose, .menuMobileOverlay", function (e) {
        e.preventDefault();
        $('body').removeClass("menuMobileActive");
    });
};
vela.productCountdown = function() {
    $('[data-countdown]').each(function() {
        var $this = $(this), finalDate = $(this).data('countdown');
        $this.countdown(finalDate, function(event) {
            $this.html(event.strftime(window.countdown_format));
        });
    });
};
vela.owlOneCarousel = function(){
    $(".owlCarouselPlay .owl-carousel").each(function(){
        var owlCarousel = $(this);
        var nav = owlCarousel.data("nav"),
            navText = owlCarousel.data("navText"),
            dots = owlCarousel.data("dots"),
            autoplay = owlCarousel.data("autoplay"),
            autoplayTimeout = owlCarousel.data("autoplaytimeout"),
            loop = owlCarousel.data("loop"),
            margin = owlCarousel.data("margin"),
            center = owlCarousel.data("center"),
            columnOne = owlCarousel.data("columnone"),
            columnTwo = owlCarousel.data("columntwo"),
            columnThree = owlCarousel.data("columnthree"),
            columnFour = owlCarousel.data("columnfour"),
            columnFive = owlCarousel.data("columnfive");
            if (margin === undefined || margin == null) {
               margin = 30;
            } 
        var config = {
            margin: margin,
            nav: nav,
            responsive:{
                0:{items:columnFive},
                480:{items:columnFour},
                768:{items:columnThree},
                992:{items:columnTwo},
                1200:{items:columnOne}
            }
        };
        (dots === undefined || dots == null || dots.length <= 0 || dots != true) ? config.dots = false : config.dots = true;
        (navText === undefined || navText == null || navText.length <= 0) ? true : config.navText = navText;
        (loop === undefined || loop == null || loop.length <= 0) ? true : config.loop = loop;
        (center === undefined || center == null || loop.center <= 0) ? true : config.center = center;
        if (autoplay){
            config.autoplay = autoplay;
            config.autoplayTimeout = autoplayTimeout;
            config.autoplayHoverPause = false;
        }
      	if (columnOne != undefined) {
        	owlCarousel.owlCarousel(config);
        }
    });
};
vela.lookbook = function() {
    vela.cache.$body.on('click', '.lookbItemButton', function() {
        var boxLookBook = $(this).parents('.velaBoxLookbook'),
            itemLookBook = boxLookBook.find('.lookbItem'),
            itemLookBookContent = boxLookBook.find('.lookbItemContent');
        if (!boxLookBook.hasClass('active')) {
            boxLookBook.addClass('active');
            itemLookBook.prepend('<div class="velaBoxLookbookOverlay"></div>');
            itemLookBookContent.prepend('<div class="velaBoxLookbookClose"></div>');
            itemLookBookContent.fadeIn(500);
        } else {
            boxLookBook.removeClass('active');
            $('.velaBoxLookbookOverlay').remove();
            $('.velaBoxLookbookClose').remove();
        }
    });
    vela.cache.$body.on('click', '.velaBoxLookbookOverlay, .velaBoxLookbookClose', function() {
        $('.velaBoxLookbook').removeClass('active');
        $('.velaBoxLookbookOverlay').remove();
        $('.velaBoxLookbookClose').remove();
        $('.lookbItemContent').fadeOut(500);
    });
};
vela.quickview = function() {
    var product = {};
    var option1 = '';
    var option2 = '';
    Shopify.doNotTriggerClickOnThumb = false;
    selectCallbackQuickView = function(variant, selector) {
        var productItem = jQuery('.jsQuickview .proBoxInfo'),
            addToCart = productItem.find('.btnAddToCart'),
            productQty = productItem.find('.proQuantity'),
            productPrice = productItem.find('.pricePrimary'),
            comparePrice = productItem.find('.priceCompare');
        if (variant) {
            productItem.find(".quickViewSKU").html("<label>SKU</label>" + variant.sku);
            if (variant.available) {
                addToCart.removeClass('disabled').removeAttr('disabled');
                addToCart.html("Add to Cart");
                productQty.show();
                productItem.find(".proBoxInfo .quickviewAvailability").removeClass('outstock').addClass('instock');
                productItem.find(".proBoxInfo .quickviewAvailability").append("<label>Availability</label>In stock");
            } else {
                addToCart.addClass('disabled').attr('disabled', 'disabled');
                addToCart.html("Sold Out");
                productQty.hide();
                productItem.find(".proBoxInfo .quickviewAvailability").removeClass('instock').addClass('outstock');
                productItem.find(".proBoxInfo .quickviewAvailability").append("<label>Availability</label>Unavailable");
            }
            productPrice.html(Shopify.formatMoney(variant.price, window.money));
            if ( variant.compare_at_price > variant.price ) {
                comparePrice
                    .html(Shopify.formatMoney(variant.compare_at_price, window.money)).show();
            } else {
                comparePrice.hide();
            }
            if (window.swatch_enable) {
                productItem.find(".selector-wrapper").addClass("hiddenVariant");
                var form = jQuery('#' + selector.domIdPrefix).closest('form');
                for (var i=0,length=variant.options.length; i<length; i++) {
                    var radioButton = form.find('.swatch[data-option-index="' + i + '"] :radio[value="' + variant.options[i] +'"]');
                    if (radioButton.size()) {
                        radioButton.get(0).checked = true;
                      	var headerValue = form.find('.swatch[data-option-index="' + i + '"] .js-swatch-display');
                  		headerValue.text(variant.options[i]);
                    }
                }
            }
            if (variant && variant.featured_image) {
                var originalImage = $(".proImageQuickview");
                var newImage = variant.featured_image;
                var element = originalImage[0];
                Shopify.Image.switchImage(newImage, element, function (newImageSizedSrc, newImage, element) {
                    $('.proThumbnails img').each(function() {
                        var parentThumbImg = $(this).parent();
                        var productImage = $(this).parent().data("image");
                        if (newImageSizedSrc.includes(productImage)) {
                            $(this).parent().trigger('click');
                            return false;
                        }
                    });
                });
            }
            if (window.currencies) {
                Currency.convertAll(window.currency, Currency.cookie.read());
            }
          console.log('sdfs');
          //addToCart.trigger('click');
        } else {
            addToCart.addClass('disabled').attr('disabled', 'disabled');
            addToCart.html("Unavailable");
            productQty.hide();
        }
    }
    changeImageQuickView = function (img, selector) {
        var src = $(img).attr("src");
        src = src.replace("_compact", "");
        $(selector).attr("src", src);
    }
    velaUpdateOptionsInSelector = function (t) {
        switch (t) {
        case 0:
            var n = "root";
            var r = $(".jsQuickview .single-option-selector:eq(0)");
            break;
        case 1:
            var n = $(".jsQuickview .single-option-selector:eq(0)").val();
            var r = $(".jsQuickview .single-option-selector:eq(1)");
            break;
        case 2:
            var n = $(".jsQuickview .single-option-selector:eq(0)").val();
            n += " / " + $(".jsQuickview .single-option-selector:eq(1)").val();
            var r = $(".jsQuickview .single-option-selector:eq(2)")
        }
        var i = r.val();
        r.empty();
        var s = Shopify.optionsMapQuickview[n];
        if(typeof s != "undefined"){
            for (var o = 0; o < s.length; o++) {
                var u = s[o];
                var a = $("<option></option>").val(u).html(u);
                r.append(a)
            }
        }
        $('.jsQuickview .swatch[data-option-index="' + t + '"] .swatch-element').each(function() {
            if ($.inArray($(this).attr("data-value"), s) !== -1) {
                $(this).removeClass("soldout").show().find(":radio").removeAttr("disabled", "disabled");
            } else {
                if (window.swatch_show_unvailable == true) {
                    $(this).addClass("soldout").find(":radio").removeAttr("checked").attr("disabled", "disabled")
                } else {
                    $(this).addClass("soldout").hide().find(":radio").removeAttr("checked").attr("disabled", "disabled")
                }
            }
        });
        if ($.inArray(i, s) !== -1) {
            r.val(i)
        }
        r.trigger("change")
    }
    velaLinkOptionSelectors = function (t) {
        for (var n = 0; n < t.variants.length; n++) {
            var r = t.variants[n];
            if (r.available) {
                Shopify.optionsMapQuickview["root"] = Shopify.optionsMapQuickview["root"] || [];
                Shopify.optionsMapQuickview["root"].push(r.option1);
                Shopify.optionsMapQuickview["root"] = Shopify.uniq(Shopify.optionsMapQuickview["root"]);
                if (t.options.length > 1) {
                    var i = r.option1;
                    Shopify.optionsMapQuickview[i] = Shopify.optionsMapQuickview[i] || [];
                    Shopify.optionsMapQuickview[i].push(r.option2);
                    Shopify.optionsMapQuickview[i] = Shopify.uniq(Shopify.optionsMapQuickview[i])
                }
                if (t.options.length === 3) {
                    var i = r.option1 + " / " + r.option2;
                    Shopify.optionsMapQuickview[i] = Shopify.optionsMapQuickview[i] || [];
                    Shopify.optionsMapQuickview[i].push(r.option3);
                    Shopify.optionsMapQuickview[i] = Shopify.uniq(Shopify.optionsMapQuickview[i])
                }
            }
        }
        velaUpdateOptionsInSelector(0);
        if (t.options.length > 1)
            velaUpdateOptionsInSelector(1);
        if (t.options.length === 3)
            velaUpdateOptionsInSelector(2);
        $("#productSelectQuickview-option-0").change(function() {
            velaUpdateOptionsInSelector(1);
            if (t.options.length === 3)
                velaUpdateOptionsInSelector(2);
            return true
        });
        $("#productSelectQuickview-option-1").change(function() {
            if (t.options.length === 3)
                velaUpdateOptionsInSelector(2);
            return true
        });
    }
    loadQuickViewSlider = function (n, r) {
        var loadingImgQuickView = $('.loadingImage');
        var s = Shopify.resizeImage(n.featured_image, "grande");
        loadingImgQuickView.hide();
        if (n.images.length > 0) {
            var o = r.find(".proThumbnailsQuickview .owl-carousel");
            for (i in n.images) {
                var u = Shopify.resizeImage(n.images[i], "grande");
                var a = Shopify.resizeImage(n.images[i], "compact");
                var f = '<div class="thumbItem"><a href="javascript:void(0)" data-imageid="' + n.id + '" data-image="' + n.images[i] + '" data-zoom-image="' + u + '" ><img src="' + a + '" alt="Produc Image" /></a></div>';
                o.append(f)
            }
            o.find("a").click(function() {
                var t = r.find(".proImageQuickview");
                if (t.attr("src") != $(this).attr("data-image")) {
                    t.attr("src", $(this).attr("data-image"));
                    loadingImgQuickView.show();
                    t.load(function(t) {
                        $(this).unbind("load");
                        loadingImgQuickView.hide()
                    })
                }
            });
            o.owlCarousel({
                items: 4,
                nav: true,
                mouseDrag: false,
                dots: false
            }).css("visibility", "visible")
        } else {        
            r.find(".jsQuickview .proThumbnailsQuickview").remove();
        }
    }
    convertToSlug = function (e) {
        return e.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-")
    }
    addCheckedSwatch = function (){
        vela.cache.$body.on('click', '.swatch .color label', function () {      
            $('.swatch .color').each(function(){      
                $(this).find('label').removeClass('checkedBox');
            });
            $(this).addClass('checkedBox');
        });
    }
    quickViewVariants = function (t, quickview) {
      console.log(t);      
      
        if (t.variants.length > 1) {
            for (var r = 0; r < t.variants.length; r++) {
                var i = t.variants[r];
                var s = '<option value="' + i.id + '">' + i.title + "</option>";
                quickview.find("form.formQuickview .proVariantsQuickview > select").append(s)
            }
            new Shopify.OptionSelectors( 'productSelectQuickview-'+t.id, { 
                product: t, 
                onVariantSelected: selectCallbackQuickView
            });
            if (t.options.length == 1) {
                $("form.formQuickview .selector-wrapper:eq(0)").prepend("<label>" + t.options[0].name + "</label>")
            }
            quickview.find("form.formQuickview .selector-wrapper label").each(function(n, r) {
                $(this).html(t.options[n].name)
            });
            if (window.swatch_enable) {
                var o = window.file_url.substring(0, window.file_url.lastIndexOf("?"));
                var u = window.asset_url.substring(0, window.asset_url.lastIndexOf("?"));
                var a = "";
                for (var r = 0; r < t.options.length; r++) {
                    a += '<div class="swatch clearfix" data-option-index="' + r + '">';
                    a += '<div class="header">' + t.options[r].name + ": <span class='js-swatch-display text'>&nbsp;</span></div>";
                    var f = false;
                    if (/Color|Colour/i.test(t.options[r].name)) { f = true }
                    var l = new Array;
                    for (var c = 0; c < t.variants.length; c++) {
                        var i = t.variants[c];
                      	var h = i.options[r];
                        var p = this.convertToSlug(h);
                        var d = "quickview-swatch-" + r + "-" + p;
                        if (l.indexOf(h) < 0) {
                          	var bgImage = o + p + '.png';
                          	if (i.featured_image) {
                            	bgImage = i.featured_image.src;
                            }
                            a += '<div data-value="' + h + '" class="swatch-element ' + (f ? "color " : "") + p + (i.availableAtStockLocation ? " available " : " soldout ") + '">';
                            if (f) {
                                a += '<div class="tooltip">' + h + "</div>"
                            }
                            a += '<input id="' + d + '" type="radio" name="option-' + r + '" value="' + h + '" ' + (c == 0 ? " checked " : "") + (i.availableAtStockLocation ? "" : " disabled") + " />";
                            if (f) {
                                a += '<label class="'+ p +'" for="' + d + '" style="background-color: ' + p + '; background-image: url(' + bgImage + ')"><img class="crossed-out" src="' + u + 'soldout_new.png" /><i></i></label>'
                            }
                            else {
                                a += '<label class="'+ p +'" for="' + d + '">' + h + '<img class="crossed-out" src="' + u + 'soldout_new.png" /></label>'
                            }
                            a += "</div>";
                            if (i.availableAtStockLocation) {
                                $('.jsQuickview .swatch[data-option-index="' + r + '"] .' + p).removeClass("soldout").addClass("available").find(":radio").removeAttr("disabled")
                            } l.push(h)
                        }
                    } a += "</div>"
                }
                quickview.find("form.formQuickview .proVariantsQuickview > select").after(a);
                quickview.find(".swatch :radio").click(function () {
                    var t = $(this).closest(".swatch").attr("data-option-index");
                    var q = $(this).val();
                    $(this).parents("form").find(".single-option-selector").eq(t).val(q).trigger("change");
                  $(this).parents('.productQuickAdd').removeClass('active');
                  $(this).parents('.formAddToCart').find('.btnAddToCart').trigger('click');
                  console.log(ajaxCart);
                  $(this).parents('.selection-wrapper').html('');
                });
                addCheckedSwatch();
            }
            if (t.available) {
                Shopify.optionsMapQuickview = {};
                if (!window.swatch_show_unvailable) {
                    velaLinkOptionSelectors(t);
                } else if (window.swatch_enable) {
                    velaLinkOptionSelectors(t);
                }
            }
          
        }
        else {
            quickview.find("form.formQuickview .proVariantsQuickview > select").remove();
            var v = '<input type="hidden" name="id" value="' + t.variants[0].id + '">';
            quickview.find("form.formQuickview").append(v)
        }        
    }
    validateQty = function (qty) {
        if((parseFloat(qty) == parseInt(qty)) && !isNaN(qty)) {

        } else {
            qty = 1;
        }
        return qty;
    };
    qvAddToCart = function(){
        if (window.ajaxcart_type != "page"){
            ajaxCart.init({
                formSelector: '.formQuickview',
                cartContainer: '#cartContainer',
                addToCartSelector: '.btnAddToCart',
                cartCountSelector: '#CartCount',
                cartCostSelector: '#CartCost',
                moneyFormat: null
            });
        }
    }
    $(document).on("click", ".proThumbnailsQuickview li", function() {
        changeImageQuickView($(this).find("img:first-child"), ".proImageQuickview");
    });
    $(document).on('click', '.quickviewClose, .quickviewOverlay', function(e){
        $("#velaQuickView").fadeOut(0);
        $(".jsQuickview").html("");
        $(".jsQuickview").removeClass('velaFadeOut');
    });
  
    $(document).on('click', '.swatch-view-item div', function(e){
      $(this).parents('.item').find('.productQuickAdd').removeClass('active');
    });
  
  	$(document).on('click', '.btnProductQuickAdd', function(e){
      vela.cache.$velaLoading.show();
      $(this).parent('.productQuickAdd').addClass('active');
      var qvhtml = $("#velaQuickAdd").html();
      $($(this).attr('data-href')).html(qvhtml);
      
      //var producthandle = $(this).data("handle");
      var productURL = $(this).parents('.velaProBlockInner').find('.proFeaturedImage').attr("href");
      console.log(productURL);
      var producthandleArr = productURL.split('/');
      var producthandle = producthandleArr[2];
      
      var quickview= $($(this).attr('data-href'));
      
      var variantDetails = [];
      Shopify.getProduct(producthandle,function(product) {
        
        $.get('https://inventorylocations.checkmyapp.net/inventory/products/eby-by-sofia-vergara.myshopify.com/['+product.id+']', function (result, textStatus, jqXHR) {
          if(textStatus == 'success'){
            $(product.variants).each(function(key, variant){
              var pt = product.title;
              
              if(result[product.id] != undefined && result[product.id].product != undefined){
                
                var info = result[product.id].product.variants[variant.id].inventoryItem.locations;
                
                if(info[0] != undefined && info[0].name == "Ecommerce WH" && info[0].available > 0){
                  product.variants[key].stockAvailable = info[0].available;
                  product.variants[key].stockLocation = info[0].name;
                  product.variants[key].availableAtStockLocation = true;
                }else{
                  product.variants[key].stockAvailable = info[0].available;
                  product.variants[key].stockLocation = info[0].name;
                  product.variants[key].availableAtStockLocation = false;
                }
              }
            });  

            //console.log(variantDetails);	

            quickview.find(".formQuickview").attr("id", "product-actions-" + product.id);
            quickview.find(".formQuickview select").attr("id", "productSelectQuickview-"+product.id);

            if (!product.available) {
              quickview.find("select, input").hide();
              quickview.find(".btnAddToCart").html("Sold Out").addClass("disabled").attr("disabled", "disabled");
              quickview.find(".proQuantity").hide();
            } else {
              quickViewVariants(product, quickview);
            }
            vela.cache.$velaLoading.hide();
            qvAddToCart();
          }
        });

        
      });
      return false;
    });
    $(document).on('click', '.btnProductQuickview', function(e){
        vela.cache.$velaLoading.show();
        var producthandle = $(this).data("handle");
        Shopify.getProduct(producthandle,function(product) {
            var qvhtml = $("#quickviewModal").html();
            $(".jsQuickview").html(qvhtml);
            var quickview= $(".jsQuickview");
            var productdes = product.description.replace(/(<([^>]+)>)/ig,"");
            var shortProductDesc = "";
            var featured_image = product.featured_image;
            if (product.description.indexOf("[SHORTDESCRIPTION]") != -1) {
                shortProductDesc = product.description.split("[SHORTDESCRIPTION]")[0];
                quickview.find(".proShortDescription").html(shortProductDesc);
            } else {
                shortProductDesc = productdes.split(" ").splice(0,30).join(" ")+"...";
                quickview.find(".proShortDescription").text(shortProductDesc);
            }
            quickview.find(".proImageQuickview").attr("src", featured_image);
            quickview.find(".proImage").attr("href", product.url);
            quickview.find(".pricePrimary").html(Shopify.formatMoney(product.price, window.money));
            quickview.find(".proBoxInfo").attr("id", "product-" + product.id);
            quickview.find(".formQuickview").attr("id", "product-actions-" + product.id);
            quickview.find(".formQuickview select").attr("id", "productSelectQuickview");
            quickview.find(".proBoxInfo .quickviewName").html("<a href='" + product.url + "'>" + product.title + "</a>");
            quickview.find(".proBoxInfo .quickViewVendor").append("<label>Vendor:</label> " + product.vendor);
            //quickview.find(".proBoxInfo .quickViewType").append(product.type);
            quickview.find(".proBoxInfo .quickViewSKU").append("<label>SKU:</label> " + product.variants[0].sku);
            if(product.available){
                quickview.find(".proBoxInfo .quickviewAvailability").removeClass('outstock').addClass('instock');
                quickview.find(".proBoxInfo .quickviewAvailability").append("<label>Availability:</label> In stock");
            }else{
                quickview.find(".proBoxInfo .quickviewAvailability").removeClass('instock').addClass('outstock');
                quickview.find(".proBoxInfo .quickviewAvailability").append("<label>Availability:</label> Unavailable");
            }
            if (product.compare_at_price > product.price) {
                quickview.find(".priceCompare").html(Shopify.formatMoney(product.compare_at_price_max, window.money)).show();
                quickview.find(".pricePrimary").addClass("priceSale");
            }
            else {
                quickview.find(".priceCompare").html("");
            }
            if (!product.available) {
                quickview.find("select, input").hide();
                quickview.find(".btnAddToCart").html("Sold Out").addClass("disabled").attr("disabled", "disabled");
                quickview.find(".proQuantity").hide();
            }
            else {
                quickViewVariants(product, quickview);
            }
            loadQuickViewSlider(product, quickview);
            $('#velaQuickView').fadeIn(0);
            $('.jsQuickview').addClass('velaFadeOut');
            vela.cache.$velaLoading.hide();
            qvAddToCart();
            if (window.currencies) {
                Currency.convertAll(window.currency, Currency.cookie.read());
            }
        });
      
        return false;
    });
};
vela.goToTop = function() {
    $(window).scroll(function() {
        if ($(window).scrollTop() >= 200) {
            $('#goToTop').fadeIn();
        } else {
            $('#goToTop').fadeOut();
        }
    });
    $("#goToTop").click(function(){
        $("body,html").animate({scrollTop:0 },"normal");
        $("#pageContainer").animate({scrollTop:0 },"normal");
            return!1
    });
};
vela.instagram = function(){
    $(".velaInstagram .boxInstagram").each(function(){
        var instagramFeed = $(this);
        var btnLoadMore = $(this).next('.insLoadMore').find('.btnInsLoadMore');
        var insId = instagramFeed.data("id"),
            insUserId = instagramFeed.data("userid"),
            insAccessToken = instagramFeed.data("accesstoken"),
            insLimited = instagramFeed.data("limit"),
            insResolution = instagramFeed.data("resolution");
        
        var feed = new Instafeed({
            get: 'user',
            userId: insUserId,
            accessToken: insAccessToken,
            target: insId,
            limit: insLimited,
            resolution: insResolution,
            template: '<a href="" title=""><img class="img-responsive" alt="" src="" /><span class="likes"></span></a>',
            before: function() {},
            after: function() {
                if (!this.hasNext()) {
                    btnLoadMore.addClass('disabled');
                }
            },
            success: function() {},
            error: function() {}
        });
        
        btnLoadMore.on('click', function() {
            feed.next();
        });
        feed.run();
    });
};
vela.productLoadMore = function () {
    function loadmoreExecute() {
        var velaLoadNode = $('.productLoadMore .btnLoadMore');
        var velaLoadUrl = $('.productLoadMore .btnLoadMore').attr("href");
        $.ajax({
            type: 'GET',
            url: velaLoadUrl,
            beforeSend: function() {
                vela.cache.$velaLoading.show();
            },
            success: function(data) {
                velaLoadNode.remove();
                vela.cache.$velaLoading.hide();
                var filteredData = $(data).find(".producsLoadMore");
                filteredData.insertBefore($(".proLoadMoreBottom"));
                btnMoreEvent();
            },
            dataType: "html"
        });
    }
    function btnMoreEvent(){
        $('.productLoadMore .btnLoadMore').click(function(e){
            if ($(this).hasClass('disableLoadMore')) {
                e.stopPropagation();
                return false;
            }
            else {
                loadmoreExecute();
                e.stopPropagation();
                return false;
            }
        });
    }
    btnMoreEvent();
};
vela.velaAccountPage = function() {
  	let currentHash = vela.getHash() || window.location.href;
  	let finalHash = "";	
  
  	if (currentHash.indexOf('#') >= 0) {
  		finalHash = currentHash.slice(currentHash.indexOf('#'), currentHash.length);
  	}
  
    $('body').on('click', '.velaRecoverPassword', function(evt) {
        //evt.preventDefault();
      	
        $('#RecoverPasswordForm').removeClass('hidden recoverMode');
        $('#CustomerLoginForm').addClass('hidden recoverMode');
      	if (evt.target.getAttribute('href') == '#') {
            $('.loginHeading').addClass('reactivate');
        }
    });
    $('body').on('click', '.velaHideRecoverPasswordLink', function(evt) {
        //evt.preventDefault();
        $('#RecoverPasswordForm').addClass('hidden recoverMode');
        $('#CustomerLoginForm').removeClass('hidden recoverMode');
      	$('.loginHeading').removeClass('reactivate');
    });
    if (finalHash == '#recover') {
        $('#RecoverPasswordForm').removeClass('hidden recoverMode');
        $('#CustomerLoginForm').addClass('hidden recoverMode');
    }
  	if (finalHash == '#') {
        $('.loginHeading').addClass('reactivate');
    }
  
    $('body').on('click', '.velaShowPassword', function(event) {
        var btnPassword = $(this),
        passwordField = btnPassword.prev('input');
        if (passwordField.attr('type') == 'password') {
            passwordField.attr('type', 'text');
            btnPassword.text("Hide");
        } else {
            passwordField.attr('type', 'password');
            btnPassword.text("Show");
        }
    });
};
/*
vela.productImage = function(){
    if (vela.cache.$velaProductImage.length > 0) {
        if (($(window).width()) >= 992){
            //DESKTOP
            var zoomYN = vela.cache.$velaProductImage.data('zoom-enable'),
                zoomScroll = vela.cache.$velaProductImage.data('zoom-scroll'),
                zoomType = vela.cache.$velaProductImage.data('zoom-type'),
                zoomWindowWidth = vela.cache.$velaProductImage.data('zoom-width'),
                zoomWindowHeight = vela.cache.$velaProductImage.data('zoom-height'),
                zoomLensSize = vela.cache.$velaProductImage.data('zoom-lens'),
                zoomLensShape = vela.cache.$velaProductImage.data('lens-shape'),
                zoomLensBorderColor = vela.cache.$velaProductImage.data('lens-border');
            vela.cache.$velaProductImage.elevateZoom({
                zoomEnabled: zoomYN,
                imageCrossfade: zoomYN,
                gallery: 'productThumbs',
                galleryActiveClass: 'active',
                cursor: 'pointer',
                zoomType: zoomType,
                scrollZoom: zoomScroll,
                zoomWindowWidth: zoomWindowWidth,
                zoomWindowHeight: zoomWindowHeight,
                lensSize: zoomLensSize,
                lensShape: zoomLensShape,
                onImageSwapComplete: function() {
                    $(".zoomWrapper div").hide();
                }
            });
            var imageGallery = [];
            var ez = vela.cache.$velaProductImage.data('elevateZoom');
            $.each(ez.getGalleryList(), function(index, value){
                imageGallery.push({"src": value.href});
            });
            vela.cache.$velaProductImage.bind('click', function(e) {
                $.fancybox.open(imageGallery);
                return false;
            });
            $("#velaViewImage").bind('click', function(e) {
                $.fancybox.open(imageGallery);
                return false;
            });
        }
        else if (($(window).width()) <= 991){
            //MOBILE
            vela.cache.$velaProductImage.elevateZoom({
                zoomEnabled: false,
                gallery: 'productThumbs'
            });
            var imageGallery = [];
            var ez = vela.cache.$velaProductImage.data('elevateZoom');
            $.each(ez.getGalleryList(), function(index, value){
                imageGallery.push({"src": value.href});
            });
            vela.cache.$velaProductImage.unbind('click');
            $('#proFeaturedImage').bind('click', function(e) {
                $.fancybox.open(imageGallery);
                return false;
            });
        }
    }
};
*/
vela.Drawers = (function () {
    var Drawer = function (id, position, iscart, options) {
        var defaults = {
            close: '.jsDrawerClose',
            open: '.jsDrawerOpen' + position,
            openClass: 'jsDrawerOpen',
            dirOpenClass: 'jsDrawerOpen' + position
        };
        this.$nodes = {
            parent: $('body, html'),
            page: $('#pageContainer'),
            moved: $('.isMoved')
        };
        this.config = $.extend(defaults, options);
        this.position = position;
        this.iscart = iscart;
        this.$drawer = $('#' + id);
        if (!this.$drawer.length) {
            return false;
        }
        this.drawerIsOpen = false;
        this.init();
    };
    Drawer.prototype.init = function () {
        $(this.config.open).on('click', $.proxy(this.open, this));
        this.$drawer.find(this.config.close).on('click', $.proxy(this.close, this));
    };
    Drawer.prototype.open = function (evt) {
        if (window.ajaxcart_type == 'modal' && this.iscart ) {
            var externalCall = false;
            this.$drawer.modal();//Use modal Bootstrap
            if (evt) {
                evt.preventDefault();
            } else {
                externalCall = true;
            }
            if (evt && evt.stopPropagation) {
                evt.stopPropagation();
                this.$activeSource = $(evt.currentTarget);
            }
            if (this.config.onDrawerOpen && typeof(this.config.onDrawerOpen) == 'function') {
                if (!externalCall) {
                    this.config.onDrawerOpen();
                }
            }
        } else {
            var externalCall = false;
            if (evt) {
                evt.preventDefault();
            } else {
                externalCall = true;
            }
            if (evt && evt.stopPropagation) {
                evt.stopPropagation();
                this.$activeSource = $(evt.currentTarget);
            }
            if (this.drawerIsOpen && !externalCall) {
                return this.close();
            }
            this.$nodes.moved.addClass('is-transitioning');
			var cart_nm = $('#CartCount').text();
			if(cart_nm=='0')
			{
				$('#cartDrawer').removeClass('not_empty_cart');
				$('#cartDrawer').addClass('empty_cart');
					var length = $('.drawerCartEmpty .shp_all').length;
				    if(length <= 0)
					{
						$('.drawerCartEmpty').append('<span class="shp_all"><a href="https://eby-by-sofia-vergara.myshopify.com/collections">Shop New Styles</a></span>');
					}
			}
			else
			{
				$('#cartDrawer').removeClass('empty_cart');
				$('#cartDrawer').addClass('not_empty_cart');
			}
            this.$drawer.prepareTransition();
            this.$nodes.parent.addClass(this.config.openClass + ' ' + this.config.dirOpenClass);
            this.drawerIsOpen = true;
            this.trapFocus(this.$drawer, 'drawer_focus');
            if (this.config.onDrawerOpen && typeof(this.config.onDrawerOpen) == 'function') {
                if (!externalCall) {
                    this.config.onDrawerOpen();
                }
            }
            if (this.$activeSource && this.$activeSource.attr('aria-expanded')) {
                this.$activeSource.attr('aria-expanded', 'true');
            }
            this.$nodes.page.on('touchmove.drawer', function () {
                return false;
            });
            this.$nodes.page.on('click.drawer', $.proxy(function () {
                this.close();
                return false;
            }, this));
        }
    };
    Drawer.prototype.close = function () {
        if (!this.drawerIsOpen) { // don't close a closed drawer
            return;
        }
        $(document.activeElement).trigger('blur');
        this.$nodes.moved.prepareTransition({ disableExisting: true });
        this.$drawer.prepareTransition({ disableExisting: true });
        this.$nodes.parent.removeClass(this.config.dirOpenClass + ' ' + this.config.openClass);
        this.drawerIsOpen = false;
        this.removeTrapFocus(this.$drawer, 'drawer_focus');
        this.$nodes.page.off('.drawer');
    };
    Drawer.prototype.trapFocus = function ($container, eventNamespace) {
        var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';
        $container.attr('tabindex', '-1');
        $container.focus();
        $(document).on(eventName, function (evt) {
            if ($container[0] !== evt.target && !$container.has(evt.target).length) {
                $container.focus();
            }
        });
    };
    Drawer.prototype.removeTrapFocus = function ($container, eventNamespace) {
        var eventName = eventNamespace ? 'focusin.' + eventNamespace : 'focusin';
        $container.removeAttr('tabindex');
        $(document).off(eventName);
    };
    return Drawer;
})();
/* ================ SHOPIFY DEBUT - VELA CUSTOMIZE ================ */
window.velatheme = window.velatheme || {};
velatheme.Sections = function Sections() {
    this.constructors = {};
    this.instances = [];
};
velatheme.Sections.prototype = _.assignIn({}, velatheme.Sections.prototype, {
    _createInstance: function(container, constructor) {
        var $container = $(container);
        var id = $container.attr('data-section-id');
        var type = $container.attr('data-section-type');
        constructor = constructor || this.constructors[type];
        if (_.isUndefined(constructor)) {
            return;
        }
        var instance = _.assignIn(new constructor(container), {
            id: id,
            type: type,
            container: container
        });
        this.instances.push(instance);
    },
    register: function(type, constructor) {
        this.constructors[type] = constructor;
        $('[data-section-type=' + type + ']').each(function(index, container) {
            this._createInstance(container, constructor);
        }.bind(this));
    }
});
vela.velaBannerTop = function () {
    var date = new Date();
    var minutes = 5;
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    if ($.cookie('velaBannerTop') == 'closed') {
        $('#bannerTop').removeClass('active');
    }
    else{
        $('#bannerTop').addClass('active');
    }
    $('#bannerTop .btn-bannerTop').click( function(){
        if ($('#bannerTop').hasClass('active')) {
            $.cookie( 'velaBannerTop', 'closed', date);
            $('#bannerTop').removeClass('active');
        }
        else{
            $.cookie( 'velaBannerTop', 'opened', date);
            $('#bannerTop').addClass('active');
        }
        
    });
};
velatheme.Slideshow = (function() {
    this.$slideshow = null;
    var classes = {
        wrapper: 'velaSlideshowWrapper',
        slideshow: 'vela--slideshow',
        currentSlide: 'slick-current',
        video: 'velassVideo',
        videoBackground: 'velassVideoBackground',
        closeVideoBtn: 'btnssVideoControlClose',
        pauseButton: 'btnssPause',
        isPaused: 'is-paused'
    };

    function slideshow(el) {
        this.$slideshow = $(el);
        this.$wrapper = this.$slideshow.closest('.' + classes.wrapper);
        this.$pause = this.$wrapper.find('.' + classes.pauseButton);
        this.settings = {
            accessibility: true,
            arrows: this.$slideshow.data('navigation'),
            dots: this.$slideshow.data('pagination'),
            fade: true,
          	pauseOnHover: false,
            draggable: true,
            touchThreshold: 20,
            autoplay: this.$slideshow.data('autoplay'),
            autoplaySpeed: this.$slideshow.data('speed')
        };
        this.$slideshow.on('beforeChange', beforeChange.bind(this));
        this.$slideshow.on('init', slideshowA11y.bind(this));
        this.$slideshow.slick(this.settings);
        this.$pause.on('click', this.togglePause.bind(this));
    }
    function slideshowA11y(event, obj) {
        var $slider = obj.$slider;
        var $list = obj.$list;
        var $wrapper = this.$wrapper;
        var autoplay = this.settings.autoplay;
        $slider.removeClass('velaSliderLoading');
        // Remove default Slick aria-live attr until slider is focused
        $list.removeAttr('aria-live');
        // When an element in the slider is focused
        // pause slideshow and set aria-live.
        $wrapper.on('focusin', function(evt) {
            if (!$wrapper.has(evt.target).length) {
                return;
            }
            $list.attr('aria-live', 'polite');
            if (autoplay) {
                $slider.slick('slickPause');
            }
        });
        //Resume autoplay
        $wrapper.on('focusout', function(evt) {
            if (!$wrapper.has(evt.target).length) {
                return;
            }
            $list.removeAttr('aria-live');
            if (autoplay) {
                // Manual check if the focused element was the video close button
                // to ensure autoplay does not resume when focus goes inside YouTube iframe
                if ($(evt.target).hasClass(classes.closeVideoBtn)) {
                  return;
                }
                $slider.slick('slickPlay');
            }
        });
        // Add arrow key support when focused
        if (obj.$dots) {
            obj.$dots.on('keydown', function(evt) {
                if (evt.which === 37) {
                    $slider.slick('slickPrev');
                }
                if (evt.which === 39) {
                    $slider.slick('slickNext');
                }
                // Update focus on newly selected tab
                if ((evt.which === 37) || (evt.which === 39)) {
                    obj.$dots.find('.slick-active button').focus();
                }
            });
        }
    };
    function beforeChange(event, slick, currentSlide, nextSlide) {
        var $slider = slick.$slider;
        var $currentSlide = $slider.find('.' + classes.currentSlide);
        var $nextSlide = $slider.find('.velassSlide[data-slick-index="' + nextSlide + '"]');
        if (isVideoInSlide($currentSlide)) {
            var $currentVideo = $currentSlide.find('.' + classes.video);
            var currentVideoId = $currentVideo.attr('id');
            velatheme.SlideshowVideo.pauseVideo(currentVideoId);
            $currentVideo.attr('tabindex', '-1');
        }
        if (isVideoInSlide($nextSlide)) {
            var $video = $nextSlide.find('.' + classes.video);
            var videoId = $video.attr('id');
            var isBackground = $video.hasClass(classes.videoBackground);
            if (isBackground) {
                velatheme.SlideshowVideo.playVideo(videoId);
            } else {
                $video.attr('tabindex', '0');
            }
        }
    }
    function isVideoInSlide($slide) {
        return $slide.find('.' + classes.video).length;
    }
    slideshow.prototype.togglePause = function() {
        var slideshowSelector = getSlideshowId(this.$pause);
        if (this.$pause.hasClass(classes.isPaused)) {
            this.$pause.removeClass(classes.isPaused);
            $(slideshowSelector).slick('slickPlay');
        } else {
            this.$pause.addClass(classes.isPaused);
            $(slideshowSelector).slick('slickPause');
        }
    };
    function getSlideshowId($el) {
        return '#velaSlideshows' + $el.data('id');
    }
    return slideshow;
})();
// Youtube API callback
// eslint-disable-next-line no-unused-vars
function onYouTubeIframeAPIReady() {
    velatheme.SlideshowVideo.loadVideos();
}
velatheme.SlideshowVideo = (function() {
    var autoplayCheckComplete = false;
    var autoplayAvailable = false;
    var playOnClickChecked = false;
    var playOnClick = false;
    var youtubeLoaded = false;
    var videos = {};
    var videoPlayers = [];
    var videoOptions = {
        ratio: 16 / 9,
        playerVars: {
            // eslint-disable-next-line camelcase
            iv_load_policy: 3,
            modestbranding: 1,
            autoplay: 0,
            controls: 0,
            showinfo: 0,
            wmode: 'opaque',
            branding: 0,
            autohide: 0,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerChange
        }
    };
    var classes = {
        playing: 'video-is-playing',
        paused: 'video-is-paused',
        loading: 'video-is-loading',
        loaded: 'video-is-loaded',
        slideshowWrapper: 'velaSlideshowWrapper',
        slide: 'velassSlide',
        slideBackgroundVideo: 'velassSlideBackgroundVideo',
        slideDots: 'slick-dots',
        videoChrome: 'velassVideo-chrome',
        videoBackground: 'velassVideoBackground',
        playVideoBtn: 'btnssVideoControlPlay',
        closeVideoBtn: 'btnssVideoControlClose',
        currentSlide: 'slick-current',
        slickClone: 'slick-cloned',
        supportsAutoplay: 'autoplay',
        supportsNoAutoplay: 'no-autoplay'
    };
    function init($video) {
        if (!$video.length) {
            return;
        }

        videos[$video.attr('id')] = {
            id: $video.attr('id'),
            videoId: $video.data('id'),
            type: $video.data('type'),
            status: $video.data('type') === 'chrome' ? 'closed' : 'background', // closed, open, background
            videoSelector: $video.attr('id'),
            $parentSlide: $video.closest('.' + classes.slide),
            $parentSlideshowWrapper: $video.closest('.' + classes.slideshowWrapper),
            controls: $video.data('type') === 'background' ? 0 : 1,
            slideshow: $video.data('slideshow')
        };
        if (!youtubeLoaded) {
            // This code loads the IFrame Player API code asynchronously.
            var tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }
    function customPlayVideo(playerId) {
        if (!playOnClickChecked && !playOnClick) {
            return;
        }
        if (playerId && typeof videoPlayers[playerId].playVideo === 'function') {
            privatePlayVideo(playerId);
        }
    }
    function pauseVideo(playerId) {
        if (videoPlayers[playerId] && typeof videoPlayers[playerId].pauseVideo === 'function') {
            videoPlayers[playerId].pauseVideo();
        }
    }
    function loadVideos() {
        for (var key in videos) {
            if (videos.hasOwnProperty(key)) {
                var args = $.extend({}, videoOptions, videos[key]);
                args.playerVars.controls = args.controls;
                videoPlayers[key] = new YT.Player(key, args);
            }
        }
        initEvents();
        youtubeLoaded = true;
    }
    function loadVideo(key) {
        if (!youtubeLoaded) {
            return;
        }
        var args = $.extend({}, videoOptions, videos[key]);
        args.playerVars.controls = args.controls;
        videoPlayers[key] = new YT.Player(key, args);
        initEvents();
    }
    function privatePlayVideo(id, clicked) {
        var videoData = videos[id];
        var player = videoPlayers[id];
        var $slide = videos[id].$parentSlide;

        if (playOnClick) {
            // playOnClick means we are probably on mobile (no autoplay).
            // setAsPlaying will show the iframe, requiring another click
            // to play the video.
            setAsPlaying(videoData);
        } else if (clicked || (autoplayCheckComplete && autoplayAvailable)) {
            // Play if autoplay is available or clicked to play
            $slide.removeClass(classes.loading);
            setAsPlaying(videoData);
            player.playVideo();
            return;
        }
        // Check for autoplay if not already done
        if (!autoplayCheckComplete) {
            autoplayCheckFunction(player, $slide);
        }
    }
    function setAutoplaySupport(supported) {
        var supportClass = supported ? classes.supportsAutoplay : classes.supportsNoAutoplay;
        $(document.documentElement).addClass(supportClass);
        if (!supported) {
            playOnClick = true;
        }
        autoplayCheckComplete = true;
    }
    function autoplayCheckFunction(player, $slide) {
        // attempt to play video
        player.playVideo();
        autoplayTest(player)
            .then(function() {
                setAutoplaySupport(true);
            })
            .fail(function() {
                // No autoplay available (or took too long to start playing).
                // Show fallback image. Stop video for safety.
                //setAutoplaySupport(false);
                //player.stopVideo();
            })
            .always(function() {
                autoplayCheckComplete = true;
                $slide.removeClass(classes.loading);
            });
    }
    function autoplayTest(player) {
        var deferred = $.Deferred();
        var wait;
        var timeout;
        wait = setInterval(function() {
            if (player.getCurrentTime() <= 0) {
                return;
            }
            autoplayAvailable = true;
            clearInterval(wait);
            clearTimeout(timeout);
            deferred.resolve();
        }, 500);
        timeout = setTimeout(function() {
            clearInterval(wait);
            deferred.reject();
        }, 4000); // subjective. test up to 8 times over 4 seconds
        return deferred;
    }
    function playOnClickCheck() {
        // Bail early for a few instances:
        // - small screen
        // - device sniff mobile browser
        if (playOnClickChecked) {
            return;
        }
        if ($(window).width() < 750) {
            playOnClick = true;
        }
        if (playOnClick) {
            // No need to also do the autoplay check
            setAutoplaySupport(false);
        }
        playOnClickChecked = true;
    }
    // The API will call this function when each video player is ready
    function onPlayerReady(evt) {
        evt.target.setPlaybackQuality('hd1080');
        var videoData = getVideoOptions(evt);
        playOnClickCheck();
        // Prevent tabbing through YouTube player controls until visible
        $('#' + videoData.id).attr('tabindex', '-1');
        sizeBackgroundVideos();
        // Customize based on options from the video ID
        switch (videoData.type) {
            case 'background-chrome':
            case 'background':
                evt.target.mute();
                // Only play the video if it is in the active slide
                if (videoData.$parentSlide.hasClass(classes.currentSlide)) {
                    privatePlayVideo(videoData.id);
                }
                break;
        }
        videoData.$parentSlide.addClass(classes.loaded);
    }
    function onPlayerChange(evt) {
        var videoData = getVideoOptions(evt);
        switch (evt.data) {
            case 0: // ended
                setAsFinished(videoData);
                break;
            case 1: // playing
                setAsPlaying(videoData);
                break;
            case 2: // paused
                setAsPaused(videoData);
                break;
        }
    }
    function setAsFinished(videoData) {
        switch (videoData.type) {
            case 'background':
                videoPlayers[videoData.id].seekTo(0);
                break;
            case 'background-chrome':
                videoPlayers[videoData.id].seekTo(0);
                closeVideo(videoData.id);
              break;
            case 'chrome':
                closeVideo(videoData.id);
                break;
        }
    }
    function setAsPlaying(videoData) {
        var $slideshow = videoData.$parentSlideshowWrapper;
        var $slide = videoData.$parentSlide;
        $slide.removeClass(classes.loading);
        // Do not change element visibility if it is a background video
        if (videoData.status === 'background') {
            return;
        }
        $('#' + videoData.id).attr('tabindex', '0');
            switch (videoData.type) {
                case 'chrome':
                case 'background-chrome':
                    $slideshow
                      .removeClass(classes.paused)
                      .addClass(classes.playing);
                      privatePlayVideo(playerId, true);
                    $slide
                      .removeClass(classes.paused)
                      .addClass(classes.playing);
                      privatePlayVideo(playerId, true);
                    break;
            }
            // Update focus to the close button so we stay within the slide
            $slide.find('.' + classes.closeVideoBtn).focus();
    }
    function setAsPaused(videoData) {
        var $slideshow = videoData.$parentSlideshowWrapper;
        var $slide = videoData.$parentSlide;
        if (videoData.type === 'background-chrome') {
            closeVideo(videoData.id);
            return;
        }
        // YT's events fire after our click event. This status flag ensures
        // we don't interact with a closed or background video.
        if (videoData.status !== 'closed' && videoData.type !== 'background') {
            $slideshow.addClass(classes.paused);
            $slide.addClass(classes.paused);
        }
        if (videoData.type === 'chrome' && videoData.status === 'closed') {
            $slideshow.removeClass(classes.paused);
            $slide.removeClass(classes.paused);
        }
        $slideshow.removeClass(classes.playing);
        $slide.removeClass(classes.playing);
    }
    function closeVideo(playerId) {
        var videoData = videos[playerId];
        var $slideshow = videoData.$parentSlideshowWrapper;
        var $slide = videoData.$parentSlide;
        var classesToRemove = [classes.pause, classes.playing].join(' ');
        $('#' + videoData.id).attr('tabindex', '-1');
        videoData.status = 'closed';
        switch (videoData.type) {
            case 'background-chrome':
                videoPlayers[playerId].mute();
                setBackgroundVideo(playerId);
                break;
            case 'chrome':
                videoPlayers[playerId].stopVideo();
                setAsPaused(videoData); // in case the video is already paused
                break;
        }
        $slideshow.removeClass(classesToRemove);
        $slide.removeClass(classesToRemove);
    }
    function getVideoOptions(evt) {
        return videos[evt.target.i.id];
    }
    function startVideoOnClick(playerId) {
        var videoData = videos[playerId];
        // add loading class to slide
        videoData.$parentSlide.addClass(classes.loading);
        videoData.status = 'open';
        switch (videoData.type) {
            case 'background-chrome':
                unsetBackgroundVideo(playerId, videoData);
                videoPlayers[playerId].unMute();
                privatePlayVideo(playerId, true);
                break;
            case 'chrome':
                privatePlayVideo(playerId, true);
                break;
        }
        // esc to close video player
        $(document).on('keydown.videoPlayer', function(evt) {
            if (evt.keyCode === 27) {
                closeVideo(playerId);
            }
        });
    }
    function sizeBackgroundVideos() {
        $('.' + classes.videoBackground).each(function(index, el) {
            sizeBackgroundVideo($(el));
        });
    }
    function sizeBackgroundVideo($player) {
        var $slide = $player.closest('.' + classes.slide);
        // Ignore cloned slides
        if ($slide.hasClass(classes.slickClone)) {
            return;
        }
        var slideWidth = $slide.width();
        var playerWidth = $player.width();
        var playerHeight = $player.height();
        // when screen aspect ratio differs from video, video must center and underlay one dimension
        if (slideWidth / videoOptions.ratio < playerHeight) {
            playerWidth = Math.ceil(playerHeight * videoOptions.ratio); // get new player width
            $player.width(playerWidth).height(playerHeight).css({
                left: (slideWidth - playerWidth) / 2,
                top: 0
            }); // player width is greater, offset left; reset top
        } else { // new video width < window width (gap to right)
            playerHeight = Math.ceil(slideWidth / videoOptions.ratio); // get new player height
            $player.width(slideWidth).height(playerHeight).css({
                left: 0,
                top: (playerHeight - playerHeight) / 2
            }); // player height is greater, offset top; reset left
        }
        $player
            .prepareTransition()
            .addClass(classes.loaded);
    }
    function unsetBackgroundVideo(playerId) {
        // Switch the background-chrome to a chrome-only player once played
        $('#' + playerId)
            .removeAttr('style')
            .removeClass(classes.videoBackground)
            .addClass(classes.videoChrome);
        videos[playerId].$parentSlideshowWrapper
            .removeClass(classes.slideBackgroundVideo)
            .addClass(classes.playing);
        videos[playerId].$parentSlide
            .removeClass(classes.slideBackgroundVideo)
            .addClass(classes.playing);
        videos[playerId].status = 'open';
    }
    function setBackgroundVideo(playerId) {
        // Switch back to background-chrome when closed
        var $player = $('#' + playerId)
            .addClass(classes.videoBackground)
            .removeClass(classes.videoChrome);
        videos[playerId].$parentSlide
            .addClass(classes.slideBackgroundVideo);
        videos[playerId].status = 'background';
        privatePlayVideo(playerId, true);
        sizeBackgroundVideo($player);
    }
    function initEvents() {
        $(document).on('click.videoPlayer', '.' + classes.playVideoBtn, function(evt) {
            var playerId = $(evt.currentTarget).data('controls');
            startVideoOnClick(playerId);
        });
        $(document).on('click.videoPlayer', '.' + classes.closeVideoBtn, function(evt) {
            var playerId = $(evt.currentTarget).data('controls');
            closeVideo(playerId);
        });
        // Listen to resize to keep a background-size:cover-like layout
        $(window).on('resize.videoPlayer', $.debounce(250, function(evt) {
            if (youtubeLoaded) {
                var playerId = $(evt.currentTarget).data('controls');
                sizeBackgroundVideos();
                privatePlayVideo(playerId, true);
            }
        }));
    }
    function removeEvents() {
        $(document).off('.videoPlayer');
        $(window).off('.videoPlayer');
    }
    return {
        init: init,
        loadVideos: loadVideos,
        loadVideo: loadVideo,
        playVideo: customPlayVideo,
        pauseVideo: pauseVideo,
        removeEvents: removeEvents
    };
})();
velatheme.slideshows = {};
velatheme.SlideshowSection = (function() {
    function SlideshowSection(container) {
        var $container = this.$container = $(container);
        var sectionId = $container.attr('data-section-id');
        var slideshow = this.slideshow = '#velaSlideshows' + sectionId;
        $('.velassVideo', slideshow).each(function() {
            var $el = $(this);
            velatheme.SlideshowVideo.init($el);
            velatheme.SlideshowVideo.loadVideo($el.attr('id'));
        });
        velatheme.slideshows[slideshow] = new velatheme.Slideshow(slideshow);
    }
    return SlideshowSection;
})();
velatheme.SlideshowSection.prototype = _.assignIn({}, velatheme.SlideshowSection.prototype, {
    onUnload: function() {
        delete velatheme.slideshows[this.slideshow];
    },
    onBlockSelect: function(evt) {
        var $slideshow = $(this.slideshow);
        // Ignore the cloned version
        var $slide = $('.velassSlide' + evt.detail.blockId + ':not(.slick-cloned)');
        var slideIndex = $slide.data('slick-index');
        // Go to selected slide, pause autoplay
        $slideshow.slick('slickGoTo', slideIndex).slick('slickPause');
    },
    onBlockDeselect: function() {
        // Resume autoplay
        $(this.slideshow).slick('slickPlay');
    }
});
$(document).ready(function() {
    $(vela.init);
    $('body').on('ajaxCart.afterCartLoad', function(evt, cart) {
        if (window.ajaxcart_type == 'drawer') {
            vela.RightDrawer.open();
        }
    });
    var sections = new velatheme.Sections();
    sections.register('velaSlideshowSection', velatheme.SlideshowSection);
	$("#collections .velaSwatchProduct li").click(function()
	{
		$("#collections .velaSwatchProduct li").css({"background": "transparent"});
		$("#collections .velaSwatchProduct li").removeClass('active');
		color = $( this ).children('label').css( "background-color" );
		if(color.indexOf('a') == -1){
			var result = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
		}
		$(this).addClass('active');
		$(this).css({"background": result});
	});
	
	$(".template-product .proBoxInfo .swatch-element").click(function()
	{
		$(".template-product .proBoxInfo .swatch-element label").parent().css({"background": "transparent"});
		$(".template-product .proBoxInfo .swatch-element label").removeClass('active');
		color = $( this ).children('label').css( "background-color" );
      	var result = 'rgba(128, 128, 128, 0.5)';
		if(color.indexOf('a') == -1){
			//var result = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
          var result = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
          //var result = 'rgba(128, 128, 128, 0.5)';
		}
		$(this).addClass('active');
		$(this).css({"background": result});
	});
	jQuery('.proList .owl-carousel').owlCarousel({
		margin:0,
		responsiveClass:true,
		responsive:{
			0:{
				items:1,
				nav:true
			},
			600:{
				items:2,
				nav:false
			},
			1000:{
				items:3,
				nav:true,
				loop:false
			}
		}
	});
  
  $('.modelSizeSelection a').on('click', function(){
    $('.modelSizeSelection a').removeClass('active');
    $(this).addClass('active');
    if($(this).data('size') == 'large'){
      $('.tpo_slider').addClass('hide');
      $('.tpo_slider[data-slidefor=large]').removeClass('hide');
      $('.tpo_slider[data-slidefor=large]').trigger('refresh.owl.carousel');
   }else{
      $('.tpo_slider').addClass('hide');
      $('.tpo_slider[data-slidefor=small]').removeClass('hide');
      $('.tpo_slider[data-slidefor=small]').trigger('refresh.owl.carousel');
    }
  });
});

(function($){
//   $(document).ready(function(){
//     $.instagramFeed({
//       'tag': 'joineby',
//       'container': "#instagram",
//       'display_profile': false,
//       'display_biography': false,
//       'display_gallery': true,
//       'callback': loadSlider(),
//       'styling': true,
//       'items': 16,
//       'lazy_load': true,				
//       'on_error': console.error
//     });
//     function loadSlider(){
//       setTimeout(function(){
//         $('#instagram .instagram_gallery').addClass('owl-carousel');
//         $('#instagram .instagram_gallery').owlCarousel({
//           loop:false,
//           margin:0,
//           nav:true,
//           dots:false,
//           responsive:{
//             0:{
//               items:1
//             },
//             600:{
//               items:2
//             },
//             1000:{
//               items:4
//             }
//           }
//         });
//       }, 8000);
//     }
//   });
  
  $('.tpo_slider').owlCarousel({
      loop: true,
      margin:0,
      nav:true,
      dots:true,
      responsive:{
          0:{
              items:1,
              stagePadding: 56
          },
          480:{
              items:2,
              stagePadding: 56
          },
          990:{
              items:2,
              stagePadding: 60
          },
          1199:{
              items:3,
              stagePadding: 75
          },
          1300:{
              items: 3,
              stagePadding: 85
          },
          1440:{
              items: 3,
              stagePadding: 100
          }
      }
  })
  
})
(jQuery);

$(window).load(function() {
  $(vela.productImage);
  $(vela.portfolio);
});
$(document).ready(function() {
  $('.btnAddToCart').on('click', function(){
    console.log('button-click');
  });
  
  var c = jQuery.getJSON('/cart.js', function (cart, textStatus) {
    return cart.responseJSON;
  });
    jQuery('body').on("click", '.r-btn', function(e){
    
    console.log('im listening');
    e.preventDefault();
    e.target.disabled = true;
    
    setTimeout(function(){
      var d= c.responseJSON;
      $.ajax({
        type: "POST",
        crossDomain : true,
        url: "https://secureddatasystem.com/ShopifyApps/eby/index.php",
        data: {data: c.responseJSON},
        dataType: 'json',
        success: function(data){
          var token = data.checkout.token;
          var url = 'https://checkout.rechargeapps.com/r/checkout/'+token+'?myshopify_domain=';

          url = appendDiscountCodeToUrl(url);

          location.href = url;
          e.target.disabled = false;
        }
      });
    }, 2000);
  });
  
  function appendDiscountCodeToUrl(url) {
    var subscriptionOffer = $('.subscription-offer');

    var hasOffer = subscriptionOffer.data("enabled");
    var coupon = subscriptionOffer.data("coupon");

    if (typeof hasOffer === "undefined" 
    || typeof coupon === "undefined") {
      return url;
    }
    
    if (hasOffer !== true) {
      return url;
    }
    
    //return `${url}&discount=${coupon}`
  	return `${url}`;
  }
  
});

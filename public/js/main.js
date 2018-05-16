/**
  * Class Ecommerce
  * Save Cart Items and Chechout
  */
  var ecommerce = function() {
    this.currentItems = 0;
    this.currentItemsCost = 0;
    this.allItems = [];
    this.selectedItems = [];
    this.selectors = {
        addItem: ".item-add",
        cartQuantity: ".cart-quantity",
        cartTotal: ".cart-total span",
        cartCheckout: ".cart-checkout",
        cartItem: ".cart-items div[data-product-value]",
        conntainer: ".content",
        itemDelete: ".item-edit a",
        cartItems: ".cart-items",
        cartTable: ".cart-table tbody",
        cartTableTotal: ".cart-table .total",
        tax: ".tax span",
        extendedWarrenty: "#warranty"
    };
    this.init();
};

ecommerce.prototype = {
    init: function() {
        var _this = this;

        // for checkout page
        if(window.location.href.indexOf("checkout") > -1) {
          _this.loadCartItems();
          return false;
        }
        var source   = $("#content").html();
        var template = Handlebars.compile(source);
        $(_this.selectors.conntainer).html("Data is being loaded.....");
        $.getJSON( "products.json", function( data ) {
            _this.allItems = data;
            $(_this.selectors.conntainer).html(template(data));
            _this.fetchItems();
            _this.bindEvents();
        });
        //redirectCart();
    },
    updateCart: function(dataId, cartItemContainer, onLoad) {
        var itemExist = false;
        this.selectedItems.forEach(function(item) {
            if(item.id == dataId) {
                itemExist = true;
                item.count++;
                $(".cart-items div[data-product-value='product-"+dataId+"']").find(".item-qty").text(item.count);
            }
        });

        if(!itemExist) {
            this.selectedItems.push({
                id: dataId,
                data: this.allItems.product[dataId],
                count: 1
            });
        }
        
        $(this.selectors.cartQuantity).text(this.currentCartValue);
        $(this.selectors.cartTotal).text(this.currentItemsCost);
        return itemExist;
    },
    bindEvents: function() {
        var _this = this;
        $(this.selectors.addItem).unbind("click").bind("click", function() {
            var dataId = $(this).attr("data-id");
            _this.fillCart(dataId, 1);
            sessionStorage.setItem("items", JSON.stringify(_this.selectedItems));
        });
        $(this.selectors.itemDelete).unbind("click").bind("click", function() {
            var dataId = $(this).attr("data-id");
            for(var i in _this.selectedItems) {
                if(parseInt(_this.selectedItems[i].id) === parseInt(dataId)) {
                    //Delete from cart.
                    _this.selectedItems.splice(i, 1);
                }
            }
            //If cart is empty
            if(!_this.selectedItems.length) {
                sessionStorage.setItem("extended", false);
                _this.currentItemsCost -= 100;
                $(_this.selectors.cartTotal).text(_this.currentItemsCost);
                $(_this.selectors.extendedWarrenty).prop('checked', false);
            }
            sessionStorage.setItem("items", JSON.stringify(_this.selectedItems));
            _this.currentItemsCost = 0;
            _this.fetchItems(_this.selectedItems);
            _this.bindEvents();
        });
        $(this.selectors.cartCheckout).unbind("click").bind("click", function() {
            console.log("_this.selectedItems", _this.selectedItems);
            if(_this.selectedItems.length) {
                window.location.href="checkout.html";
            } else {
                alert("Your cart is empty!");
            }
        });
        $(this.selectors.extendedWarrenty).unbind("change").bind("change", function() {
            if(this.checked) {
                _this.currentItemsCost += 100;
            } else {
                _this.currentItemsCost -= 100;
            }
            $(_this.selectors.cartTotal).text(_this.currentItemsCost);
            sessionStorage.setItem("extended", this.checked);
        });
    },
    fillCart: function(dataId, count = 1, onLoad) {
        var itemContainer = $('button[data-id="'+dataId+'"]').parents('.item').parent();
        var dataProduct = itemContainer.attr('data-product');
        for(var i in this.selectedItems) {
            count = (this.selectedItems[i].id === dataId) ? this.selectedItems[i].count : count;
        }
        this.currentItems += count;

        if(onLoad) {
            this.currentItemsCost = this.currentItemsCost + (this.allItems.product[dataId].Price * count);
            $(this.selectors.cartTotal).text(this.currentItemsCost);
        } else {
            this.currentItemsCost = this.currentItemsCost + this.allItems.product[dataId].Price;
        }
        
        if(onLoad || !this.updateCart(dataId, dataProduct, onLoad)) {
            var template = $("#addProduct").html();
            var itemHtml = Handlebars.compile(template)({
                dataProductValue: dataProduct,
                itemImage: this.allItems.product[dataId].Image,
                itemName: this.allItems.product[dataId].Name,
                count: count,
                index: dataId,
            });
            $(this.selectors.cartItems).append(itemHtml);
            this.bindEvents();
        }
    },
    rebuildCart: function(itemObj) {
        var _this = this;
        var extendedWarrenty = sessionStorage.getItem("extended") || false;
        if(extendedWarrenty == "true" || extendedWarrenty == true) {
            $(this.selectors.extendedWarrenty).prop('checked', true);
        }
        this.currentItemsCost = (extendedWarrenty == "true" 
        || extendedWarrenty == true) ? 100 : 0;
        $(this.selectors.cartItems).html("");
        $(this.selectors.cartTotal).text(this.currentItemsCost);
        $.each(itemObj, function(item, value) {
            _this.fillCart(value.id, value.count, true);
        });
        this.selectedItems = itemObj;
    },
    fetchItems: function(existingItems) {
        var items = existingItems ? existingItems : sessionStorage.getItem("items");
        if (typeof(Storage) !== "undefined" && items) {
            var itemObj = existingItems ? existingItems : JSON.parse(items);
            this.rebuildCart(itemObj);
        } else {
            // Sorry! No Web Storage support..
        }
    },
    loadCartItems: function() {
      var _this = this;
      var items = sessionStorage.getItem("items");
      var itemObj = JSON.parse(items);
      var template = $("#cartProduct").html();
      var totalPrice = 0;
      var tax = 0;
      var extended = sessionStorage.getItem("extended");
      var ifExtended = (extended == "true" || extended == true) ? true : false;
      console.log("ifExtended", ifExtended, extended);
      if(ifExtended) {
        $(".optional-warrenty").show();
        totalPrice += 100;
      } else {
        $(".optional-warrenty").hide();
      }
      $.each(itemObj, function(item, value) {
        var price = value.data.Price*value.count;
        totalPrice += price;
        var itemHtml = Handlebars.compile(template)({
          itemImage: value.data.Image,
          itemName: value.data.Name,
          count: value.count,
          index: value.id,
          price: price
        });
        $(_this.selectors.cartTable).append(itemHtml);
      });
      if($(_this.selectors.tax)[0]) {
        $(_this.selectors.tax).each(function() {
          tax += parseInt($(this).text());
        });
        totalPrice += tax;
      }
      $(_this.selectors.cartTableTotal).text("$"+totalPrice);
    }
};

$(document).ready(function() {
    new ecommerce();
});
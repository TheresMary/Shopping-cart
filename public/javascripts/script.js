const { parse } = require("handlebars")

function addToCart(prodId){
    $.ajax({
      url:'/add-to-cart/'+prodId,   //where to go onclicking button
      method:'get',
      success: (response)=>{
          if (response.status){
              let count=$('#cart-count').html()
              count=parseInt(count)+1        //convert to int & add 1
              $('#cart-count').html(count)
          }
        //alert(response)
      }
    })
  }
1 . post http://localhost:5009/api/checkout
   body :
   {
  "shippingAddress": {
    "fullName": "Atlas Flame",
    "addressLine1": "456 Park Avenue",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "411001",
    "country": "India",
    "phone": "9123456780"
  }
}
 this will buy all items in cart


 2 .post http://localhost:5009/api/checkout/single

 body:
 
{
  "productId": "67bc5c4fa2ff5fb7f2f50f0d",
  "quantity": 1,
  "shippingAddress": {
    "fullName": "Atlas Flame",
    "addressLine1": "Pimpri",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "411001",
    "country": "India",
    "phone": "9123456780"
  }
}

this will buy the single item from the cart
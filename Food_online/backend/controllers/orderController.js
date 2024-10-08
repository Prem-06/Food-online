import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
  const frontend_url = "https://food-online-five.vercel.app";
  // const frontend_url = process.env.FRONTEND_URL;
  try {
   
    const newOrder = new orderModel({
      userId: req.body.userId, 
      items: req.body.items,
      amount: req.body.amount,
      address: req.body.address,
    });

    await newOrder.save();
    await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

    // const line_items = req.body.items.map((item) => ({
    //   price_data: {
    //     currency: "inr",
    //     product_data: {
    //       name: item.name,
    //     },
    //     unit_amount: item.price,
    //   },
    //   quantity: item.quantity*80,
    // }));

    // line_items.push({
    //   price_data: {
    //     currency: "inr",
    //     product_data: {
    //       name: "Delivery Charges",
    //     },
    //     unit_amount: 2*100*80,
    //   },
    //   quantity: 1,
    // });

    // const session = await stripe.checkout.sessions.create({
    //   line_items: line_items,
    //   mode: "payment",
    //   success_url: `${frontend_url}/verify?success`,
    //   // success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
    //   cancel_url: `${frontend_url}/verify?success`,
    //   // cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    // });

    
    res.json({
      success: true,
      session_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      orderId:newOrder._id
    });
  } catch (error) {
    res.json({
      success: false,
      message: "Error!",
    });
  }
};


const verifyOrder = async (req, res) => {
  
  const { orderId, success } = req.body;

  try {
    
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      res.json({ success: true, message: "Paid!" });
    }
    
    else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error!" });
  }
};

// User's order API for frontend
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ userId: req.body.userId });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error!" });
  }
};


const listOrders = async (req, res) => {
  try {
      const hotelId= req.body.userId;
      let orders = await orderModel.find({});

      let filteredOrders = orders.map((order) => {
        let filteredItems = [];
        let totalCost = 0;
        order.items.forEach((item) => {
          if (item.hotelId._id === hotelId) {
            filteredItems.push(item);
            totalCost += item.quantity * item.price;
          }
        });
      
        order.items = filteredItems;
        order.amount = totalCost;
        return order;
      }).filter(order => order.items.length > 0); 
      orders = filteredOrders;
   

res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error!" });
  }
};

// API for updating order status
const updateStatus = async (req, res) => {
  try {
    // Finding the order using Id, then updating the status value
    await orderModel.findByIdAndUpdate(req.body.orderId, {
      status: req.body.status,
    });
    res.json({ success: true, message: "Status Updated!" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error!" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };

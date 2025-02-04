// ONLY ADMINS SHOULD GET THE ACCESS OF ALL THE PRODUCTs (users can only see recommended products)


import Product from "../models/product.models.js";
import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (res,req) => {
  try{
    const products = await Product.find({})  // this is get all the products (admin will have all the products)
    res.json({ products })
  } catch (error) {
      console.log("Error in getAllProducts controller", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
  }
}

export const getFeaturedProducts = async (res, req) => {
    try{  // these products will be accessed by everyone. So store this in mongoDB awa RedisDB (makes it faster; as evryone can access these products)
      // first we need to check if anything's there in DB or not
      let featuredProducts = await redis.get("featured products")
      
      if(featuredProducts) {
        return res.json(JSON.parse(featuredProducts))
      }

      // if not in redis, fetch it from mongoDB
      featuredProducts = await Product.find({isFeatured:true}).lean()  // .lean() :- instead of returning mongoDb objects/document it returns plain javaScript objects; which is good for performance  

      if(!featuredProducts) {
        return res.status(404).json({ message: "No featured products found" })
      }
      
      // store in redis for future quick access
      await redis.set("featured_products", JSON.stringify(featuredProducts))   // stringify the featuredProducts we got from mongoDb

      res.json(featuredProducts)  // And finally, returning the response
      
    } catch (error) {
        console.log("Error in getFeaturedProducts controller", error.message)
		res.status(500).json({ message: "Server error", error: error.message })
    }
}


// first we'll save it to the DB and also create an image where we store in the cloudinary bucket
export const createProduct = async (res, req) => {
   try{
    const {name, description, price, image, category} = req.body   // user will send couple of diff fields for the product

    let cloudinaryResponse = null

    if(image) {
        cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"})
    }

    // now we should be able to create that in the DB
    const product = await Product.create({
        name,
        description,
        price,
        image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url: "",  // let's say for some reason this is empty, we acn put an empty string
        category
    })

    res.status(201).json(product)
   } catch (error) {
    console.log("Error in createProduct controller", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
   }
}


export const deleteProduct = async (req, res) => {  // we(admin) not only wants the product Image to be deleted from the DB but also from the cloudinary
	try {
		const product = await Product.findById(req.params.id)  // "id" from product.route.js

		if (!product) {
			return res.status(404).json({ message: "Product not found" })
		}

		if (product.image) {  // even though we're always gonna have img as it is a required field
			const publicId = product.image.split("/").pop().split(".")[0]  // this will give the idea of the img
            // splitting from the "/" 
            // .split(".")[0] means getting the 1st argument
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`)  // this gonna be under product folder
				console.log("deleted image from cloduinary")
			} catch (error) {
				console.log("error deleting image from cloduinary", error)
			}
		}

        // deleting from the DB as well
		await Product.findByIdAndDelete(req.params.id)

		res.json({ message: "Product deleted successfully" })
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message)
		res.status(500).json({ message: "Server error", error: error.message })
	}
};


// here, we'll be using aggregation pipeline from mongoDb or mongoose in this case
export const getRecommendedProducts = async (req, res) => {
    try {
		const products = await Product.aggregate([  // array of objects
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
}


export const getProductsByCategory = async (req, res) => {
    const { category } = req.params;
	try {
		const products = await Product.find({ category });
		console.log("first", products);
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message)
		res.status(500).json({ message: "Server error", error: error.message })
	}
}

// if the product is featured (yellow star marked) then we're gonna see that in feature section  (1:57:30)
// Here, we would communicate w the Redis to update (add or delete) the cache.
// on toggle, we should be able to add or delete from the cache
export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id)  // getting the single product
		if (product) {
			product.isFeatured = !product.isFeatured  // updating: on toggle
			const updatedProduct = await product.save()  // updated in DB
			await updateFeaturedProductsCache()   // updating the cache
			res.json(updatedProduct)
		} else {
			res.status(404).json({ message: "Product not found" })
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message)
		res.status(500).json({ message: "Server error", error: error.message })
	}
}


async function updateFeaturedProductsCache() {
	try {
		// The lean() method is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean()
		await redis.set("featured_products", JSON.stringify(featuredProducts))
	} catch (error) {
		console.log("error in update cache function")
	}
}
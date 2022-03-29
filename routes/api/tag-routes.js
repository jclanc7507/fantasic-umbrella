const router = require('express').Router();
const { Tag, Product, ProductTag } = require('../../models');
const { update } = require('../../models/Product');

// The `/api/tags` endpoint

router.get('/', (req, res) => {
  // find all tags
// be sure to include its associated Product data
  Tag.findAll({
    attributes: [
      'id',
      'tag_name'
    ],
    include: [
      {
        model: Product,
        attributes: [
          'id', 
          'product_name', 
          'price', 
          'stock', 
          'category_id'
        ]
      }
    ]
  })
  .then(dbProductData => res.json(dbProductData))
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  })
});

router.get('/:id', (req, res) => {
  // find a single tag by its `id`
  // be sure to include its associated Product data
  Tag.findOne({
    where: {id: req.params.id},
    attributes: ['tag_name'],
    include: [
      {
        model: Product,
        attributes: [
          'id',
          'product_name',
          'price',
          'stock',
          'category_id'
        ]
      }
    ]
  })
  .then(dbProductData => res.json(dbProductData))
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  })
});

router.post('/', (req, res) => {
  // create a new tag
  Tag.create(req.body)
    .then((tag) => {
      if (req.body.productId.length) {
        const productTagIdArr = req.body.productId.map((product_id) => {
          return {
            tag_id: tag.id,
            product_id
          };
        });
        return ProductTag.bulkCreate(productTagIdArr); 
      }
      res.status(200).json(tag);
    })
    .then((productTagIds) => res.status(200).json(productTagIds))
    .catch((err) => {
      console.log(err);
      res.status(400).json(err);
    });
});

router.put('/:id', (req, res) => {
  // update a tag's name by its `id` value
  Tag.update(
    req.update(
      req.body,
      {
        where: {
          id: req.params.id
        }
      })
      .then(tag => {
        return ProductTag.findAll({ where: {tag_id: req.params.id}});
      })
      .then ((productTags) => {
        let productTagIds = productTags.map(({ product_id }) => product_id);

        if (req.body.productId) {

          let newProductTags = req.body.productId
            .filter((product_id) => !productTagIds.includes(product_id))
            .map((product_id) => {
              return {
                tag_id: req.params.id,
                product_id
              };
            });

          let productTagsToRemove = productTags
            .filter(({ product_id }) => !req.body.productId.includes(product_id))
            .map(({ id }) => id);

          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove }}),
            ProductTag.bulkCreate(newProductTags),
          ]);
        }
      })
      .then((updatedProductTags) => res.json(updatedProductTags))
      .catch(err => {
        console.log(err);
        res.status(500).json(err);
      })
  )
});

router.delete('/:id', (req, res) => {
  // delete on tag by its `id` value
  Tag.destroy({
    where: {
      id: req.params.id
    }
  })
  .then(tagData => {
    if (!tagData) {
      res.status(404).json({ message: 'No tag found with this ID.'});
      return;
    }
    res.json(tagData);
  })
  .catch(err => {
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = router;

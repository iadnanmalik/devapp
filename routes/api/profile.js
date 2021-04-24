const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const Profile = require('../../models/Profile');
//expres-validator.github.io--> documentation
const {check, validationResult}= require('express-validator');
const gravatr = require('gravatar');
const bcrypt= require('bcryptjs');
const User = require('../../models/Users');
const jwt = require('jsonwebtoken');
const request = require('request');

const config = require('config');
const { response } = require('express');

router.get('/me',auth, async (req,res) =>{
    try{
    const profile =  await Profile.findOne({ user: req.user.id}).populate('user',['name','avatar']);
    
    if(!profile){
        return res.status(400).json({ msg: "There is no profile for this user"});
    }
    res.json(profile);

    }
    catch(err){
        console.error(err.message);
        res.status(500).send('Server Error ');

    }
}  );

router.post('/',[auth,[
    check('status','Status is required').not().isEmpty(),
    check('skills',"Skills is required").not().isEmpty()
]
], 
async (req,res) =>{
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
      } = req.body;
       // Build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) {
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    // Build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOne({user : req.user.id});
      if(profile){

        profile = await Profile.findOneAndUpdate(
            {user: req.user.id},
            {$set: profileFields},
            {new: True}
        );

        return res.json(profile);

      }
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
})

router.get('/', async(req,res) =>{
  try {
    const profiles = await Profile.find().populate('user',['name','avatar']);
    res.json(profiles);

  } catch (err) {
    console.error(error.message);
    res.status(500).send("Server Error")
  }
})

router.get('/user/:user_id',async(req,res)=>{
  try {
    const profile = await Profile.findOne({user: req.params.user_id}).populate('user',['name','avatar']);
    if(!profile){
      return res.status(400).send("No profile for user");
    }
    res.json(profile);
  } catch (err) {
    console.error(error.message);
    res.status(500).send("Server Error")
    
  }
})

router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    // Remove profile
    // Remove user
    await Promise.all([
      Profile.findOneAndRemove({ user: req.user.id }),
      User.findOneAndRemove({ _id: req.user.id })
    ]);

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(error.message);
    res.status(500).send("Server Error")
  }
});

router.put('/experience',[auth,[
  check('title','Title is required').not().isEmpty(),
  check('company','Company is required').not().isEmpty(),
  check('from','From Date is required').not().isEmpty(),
  
]],async (req,res) =>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }

  const {title,company,location,from,to,current,description}=req.body;

  const newExperience = {
    title,
    company,
    location,
    from,
    to,
    current,
    description
  }
  try {
    const profile= await Profile.findOne({user : req.user.id});
    profile.experience.unshift(newExperience);
     await profile.save();

     res.json(profile);


  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error")
  }

});
router.delete('/experience/:exp_id',auth,async(req,res) => {
  try{
    const profile = await Profile.findOne({user: req.user.id});

    const removeIndex= profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex,1);
   
    await profile.save();

    res.json(profile);
  } 
  catch(err){
    console.error(err.message);
    res.status(500).send("Server Error")

  }
});


router.put('/education',[auth,[
  check('school','School is required').not().isEmpty(),
  check('degree','Degree is required').not().isEmpty(),
  check('from','From Date is required').not().isEmpty(),
  check('fieldofstudy','Field of study  is required').not().isEmpty(),
  
]],async (req,res) =>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()});
  }

  const {school,degree,fieldofstudy,from,to,current,description}=req.body;

  const newEdu = {school,degree,fieldofstudy,
    from,
    to,
    current,
    description
  } 
  try {
    const profile= await Profile.findOne({user : req.user.id});
    profile.education.unshift(newEdu);
     await profile.save();

     res.json(profile);


  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error")
  }

});
router.delete('/education/:edu_id',auth,async(req,res) => {
  try{
    const profile = await Profile.findOne({user: req.user.id});

    const removeIndex= profile.education.map(item => item.id).indexOf(req.params.edu_id);

    profile.education.splice(removeIndex,1);
   
    await profile.save();

    res.json(profile);
  } 
  catch(err){
    console.error(err.message);
    res.status(500).send("Server Error")

  }
});

router.get('/github/:username',(req,res)=>{
  try {

    const options ={
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}
      &client_secret= ${config.get('githubSecret')}`,
      method: 'GET',
      headers:{'user-agent': 'node.js'}
    };

    request(options, (error,response,body)=>{
      if(error) console.log(error);
      if(response.statusCode!= 200){
        return res.status(404).json({msg:'No github profile found'})
      }
      //when requesting a web server the data is always 
      //in the form of a string so parse the data to convert it
      //into a JSON object
      res.json(JSON.parse(body));

    })

    
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error")
    
  }
})



module.exports = router;

import React, {Fragment,useState} from 'react'
import {Link, Redirect} from 'react-router-dom';
import {connect } from 'react-redux';
import PropTypes from 'prop-types';
import {login} from '../../actions/auth';


const Login = ({login, isAuthenticated}) => {

    const [formData, setFormData]= useState({
        email: "",
        password: "",
    });

    const {email,password}= formData

    const onChange = e => setFormData({...formData,[e.target.name]: e.target.value});

    const onSubmit = e => {

        e.preventDefault();
        login(email,password);
    }

    //Redirect if Logged in 
    if(isAuthenticated){
      return <Redirect to="/dashboard"></Redirect>
    }
    return (
        <Fragment>
            <section className="container">
      <h1 className="large text-primary">Sign In</h1>
      <p className="lead"><i className="fas fa-user"></i> Sign Into your Account</p>
      <form className="form" onSubmit={e => onSubmit(e)}>
        <div className="form-group">
          <input type="email" placeholder="Email Address" 
          name="email" 
          value= {email} 
          onChange={e => onChange(e)}
          />
          <small className="form-text"
            >This site uses Gravatar so if you want a profile image, use a
            Gravatar email</small
          >
        </div>
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            name="password"
            minLength="6"
            value= {password} 
            onChange={e => onChange(e)}
          />
        </div>
        <input type="submit" className="btn btn-primary" value="Register" />
      </form>
      <p className="my-1">
        Already have an account? <Link to='/register'>Sign Up</Link>
      </p>
    </section>
        </Fragment>
    )
}

Login.propTypes={
  login: PropTypes.func.isRequired,
  isAuthenticated: PropTypes.bool
};
const mapStateToProps = state =>({

  isAuthenticated: state.auth.isAuthenticated
})


export default connect(mapStateToProps,{login})(Login);


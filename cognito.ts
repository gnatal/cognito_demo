import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails, 
  ICognitoUserPoolData,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js'
import { redirect, useNavigate } from 'react-router-dom'

const UserPoolId = process.env.REACT_APP_USER_POOL_ID 
const ClientId = process.env.REACT_APP_CLIENT_ID;

export const poolData: ICognitoUserPoolData = {
  UserPoolId: UserPoolId || '',
  ClientId: ClientId || ''
}

interface ILogin {
  email: string,
  password: string
}

interface IVerify {
  email: string,
  code: string
}

interface IPasswordRecovery {
  email: string,
  code: string,
  password: string
}

const pool = new CognitoUserPool(poolData)


const signUp = ({email, password}: ILogin) => {
  return new Promise((resolve, reject) => {
    pool.signUp(email, password, [], [new CognitoUserAttribute({ Name: 'email', Value: email })], (err, data) => {
      if(err) {
        const stringErr = err.toString()
        if(stringErr.includes("UsernameExistsException")){
          reject("Email already exists")
          return
        }
        reject(err)
      }else {
        console.log(data)
        resolve(data)
      }
    })  
  })
}

export const login = ({email, password}: ILogin) => {
  const user = new CognitoUser({
    Username: email,
    Pool: pool
  })
  const authDetails = new AuthenticationDetails({
    Username: email,
    Password: password
  })
  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (data) => {
        console.log('onsuccess', data)
        resolve(data)
      },
      onFailure: (err) => {
        console.error("onFailure", err)
        reject(err)
      },
      newPasswordRequired: (userAttributes,requiredAttributes ) =>{
        delete userAttributes.email_verified;
        delete userAttributes.Email
        user.completeNewPasswordChallenge(password, {}, {
          onSuccess: (data) => {
            console.log("Sucess ",data);
          },
          onFailure: (err) => {
            console.log("error", err)
          }
        })
        resolve(userAttributes)
      }
    })

  })
}

const changePassword = (cognitoUser:any, newPassword:any, oldPassword:any) => {
  cognitoUser.changePassword(oldPassword, `${newPassword}-1`, function(err:any, result:any) {
    if (err) {
      console.log(err)
      return;
    }
    console.log('call result: ' + result);
  });
}

export const verifyUser = ({email, code}: IVerify) => {
  const user = new CognitoUser({
    Username: email,
    Pool: pool
  })

  user.confirmRegistration(code, true, function(err, result) {
    if (err) {
      alert(err.message || JSON.stringify(err));
      return;
    }
    console.log('call result: ' + result);
    }
  )
}

export const getSession = async () => {
  return await new Promise((resolve, reject) => {
    const user = pool.getCurrentUser()
    if(user) {
      user.getSession((err:any, session:any) => {
        if(err) {
          reject(err);
        } else {
          resolve(session)
        }
      });
    } else {
      reject("User not found")
    }
  })
}

export const logout = () => {
  const user = pool.getCurrentUser();
  if(user) {
    user.signOut()
  }
}

export const forgotPassword = ({email}: {email:string}) =>{
  const user = new CognitoUser({
    Username: email,
    Pool: pool
  })

  return new Promise ((resolve, reject) => {
    user.forgotPassword({
      onSuccess: function(data) {
        resolve(data)
      },
      onFailure: function(err) {
        reject(err)
      }
    })

  })
}

export const passwordRecovery = ({email, code, password} : IPasswordRecovery) => {
  const user = new CognitoUser({
    Username: email,
    Pool: pool
  })
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, password, {
      onSuccess: () => {
        console.log('Password confirmed')
        resolve('success')
      },
      onFailure: (err)  => {
        const stringErr = err.toString();
        if(stringErr.includes("CodeMismatchException")) {
          reject('CodeMismatchException')
          return;
        }
        reject(err)
      }
    })
  })

}


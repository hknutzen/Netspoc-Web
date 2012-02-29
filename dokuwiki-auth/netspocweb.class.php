<?php
/**
 * netspocweb auth backend
 *
 * Uses external Trust mechanism to check against a netspocweb session id
 *
 * @author    Heinz Knutzen <heinz.knutzen@dataport.de>
 *
 *   $conf['auth']['netspocweb']['cookie']  = 'CGISESSID';
 *   $conf['auth']['netspocweb']['group']   = 'user';
 *
 */

class auth_netspocweb extends auth_basic {
 
  /**
   * Constructor.
   */
  function auth_netspocweb(){
    global $conf;
    $this->cnf = $conf['auth']['netspocweb'];
    $this->cando['external'] = true;
  }
 
  /**
   * Just checks against the netspocweb sessionid variable
   */
  function trustExternal($user,$pass,$sticky=false) {
    global $USERINFO;
    $cookie = $this->cnf['cookie'];

    if(! isset($_COOKIE[$cookie])){
	return false;
    }
    $s_id = $_COOKIE[$cookie];
    $curl = curl_init("https://10.1.22.115/netspocweb/backend/session_email");
    curl_setopt($curl, CURLOPT_HTTPHEADER, array('Cookie: '.$cookie.'='.$s_id));
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($curl, CURLOPT_FAILONERROR, true);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
    $email = curl_exec($curl);

    if (! $email) {
	return false;
    }

    # Try to find admin user
    $admin = $this->_getEmailUser($email);
    if ($admin) {
 	$user = $email;
	$name = $admin['name']; 
	$grps = $admin['grps'];
    }
    # Otherwise take default value.
    else {
	$grps[] = $this->cnf['group'];;
	$user = $email;
    }

    $USERINFO['name'] = $name;
    $USERINFO['mail'] = $email;
    $USERINFO['grps'] = $grps;
 
    $_SERVER['REMOTE_USER'] = $user;
    $_SESSION[DOKU_COOKIE]['auth']['user'] = $user;
    $_SESSION[DOKU_COOKIE]['auth']['info'] = $USERINFO;

    return true;
  }

    /**
     * Load user, name and groups for email
     *
     * check for definitions in the user file 
     */
    function _getEmailUser($email){
      global $config_cascade;

      if(!@file_exists($config_cascade['plainauth.users']['default'])) return;

      $lines = file($config_cascade['plainauth.users']['default']);
      foreach($lines as $line){
        $line = preg_replace('/#.*$/','',$line); //ignore comments
        $line = trim($line);
        if(empty($line)) continue;

        $row    = explode(":",$line,5);
        $groups = array_values(array_filter(explode(",",$row[4])));
	
	if(strtolower($email) == strtolower($row[3])) {
	    return array('user' => $row[0], 'name' => $row[2], 'grps' => $groups);
	}
      }
      return;
    }
}




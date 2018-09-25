function improveCertKeyChainSelection(){

    $('input[name="cert_key_chain_override"]').on("click", matchCertAndKey);

    $('input[name="add_modal_button"]').on("mouseup", function(){
        setTimeout(function(){

            var currentPartition = getCookie("F5_CURRENT_PARTITION");
            var profileName = $("input[name='profile_name']").val();

            if($("select#cert option[value='/" + currentPartition + "/" + profileName + ".crt']").length > 0){
                $('select#cert').val("/" + currentPartition + "/" + profileName + ".crt");
                $('select#key').val("/" + currentPartition + "/" + profileName + ".key");
            } else if ($("select#cert option[value='/Common/" + profileName + ".crt']").length > 0){
                $('select#cert').val("/Common/" + profileName + ".crt");
                $('select#key').val("/Common/" + profileName + ".key");
            }

            $('select#chain').val(defaultChain)

        }, 500);
    });

}
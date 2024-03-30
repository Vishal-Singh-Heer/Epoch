import React, {useEffect, useState, useContext} from "react";
import {Spinner} from "../modules/Spinner";
import {UserContext} from "../services/UserContext";
import {getFavoritePosts} from "../services/post";
import Feed from "../modules/Feed";
import NavBar from "../modules/NavBar";
import '../styles/Favorites.css';
import PostPopup from "../modules/PostPopup";
import {getUserInfo} from "../services/user";


function Favorites() {
    const [isLoading, setIsLoading] = useState(true);
    const {user, updateUser} = useContext(UserContext);
    const [showNewPostPopup, setShowNewPostPopup] = useState(false);
    const [refreshFeed, setRefreshFeed] = useState(true);

    useEffect(() => {
        if (!user) {
            getUserInfo()
                .then((data) => {
                    updateUser(data);
                    setIsLoading(false);
                })
                .catch((error) => {
                    updateUser(null);
                    setIsLoading(false);
                });
        }
    }, [updateUser, user]);

    if (!user) {
        return (
            <Spinner/>
        );
    }

    return (
        <>
            {user && <NavBar profilePic={user.profile_pic_data} profilePicType={user.profile_pic_type}
                             showNewPostPopup={showNewPostPopup} setShowNewPostPopup={setShowNewPostPopup} userId={user.id}/>}
            {isLoading ? (
                <Spinner/>
            ) : (
                <div className={"favorites-page-container"}>
                    <div className={"favorites-feed-wrapper"}>
                        <div className={"favorites-feed"}>
                            {user ? (<Feed feedUsername={user.username} feedUserId={user.id} isInProfile={true}
                                           currentUser={user} showNewPostPopup={showNewPostPopup}
                                           setShowNewPostPopup={setShowNewPostPopup} refreshFeed={refreshFeed}
                                           setRefreshFeed={setRefreshFeed}
                                           isInFavorites={true}/>) : (<></>)}
                        </div>
                    </div>
                    {user ? (<PostPopup showPopup={showNewPostPopup} setShowPopup={setShowNewPostPopup}
                                        username={user.username} profilePic={user.profile_pic_data}
                                        refreshFeed={refreshFeed} setRefreshFeed={setRefreshFeed}/>) : (<></>)}
                </div>
            )}
        </>
    );
}

export default Favorites;
import React, {useState, useEffect} from 'react';
import '../styles/Feed.css';
import {Spinner} from "./Spinner";
import Post from "./Post";
import {getAllUserPosts, getFollowedUsersPost, getAllHashtagPosts} from '../services/post.js'
import {useRef} from "react";
import {useInView} from "react-intersection-observer";

export default function Feed({
                                 feedUsername,
                                 feedUserId,
                                 isInProfile,
                                 currentUser,
                                 showNewPostPopup,
                                 setShowNewPostPopup,
                                 refreshFeed,
                                 setRefreshFeed,
                                 viewingOnly,
                                 posts,
                                 isInFavorites,
                                 isInHashtags,
                                 hashtag
                             }) {

    const [isLoading, setIsLoading] = useState(true);
    const [feedPosts, setFeedPosts] = useState([]);
    const [noMorePosts, setNoMorePosts] = useState(false);
    const [firstRender, setFirstRender] = useState(true);
    const [loadingTop, setLoadingTop] = useState(true);
    const [allowScrollToTop, setAllowScrollToTop] = useState(false);
    const [noMoreTopPosts, setNoMoreTopPosts] = useState(false);
    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(20); // must be bigger tha maxPosts
    const maxPosts = 25;
    const toRemove = 15; // Must be smaller than maxPosts
    const [previousPosts, setPreviousPosts] = useState([]);
    const bottomElementRef = useRef(null);
    const [ref, inView] = useInView({threshold: 0.1, });


    const refreshFeedPosts =  (reset, fromTop) =>
    {
        let finalOffset = reset ? 0 : (offset);
        let finalFeedPosts = reset ? [] : feedPosts;

        if (reset)
        {
            setFeedPosts([]);
            setNoMorePosts(false);
            setNoMoreTopPosts(false);
            setAllowScrollToTop(false);
        }

        if (fromTop)
        {
            onNewTopPosts(finalOffset);
            setIsLoading(false);
            setLoadingTop(false);
            return;
        }

        if (!posts)
        {
            if (isInHashtags && hashtag)
            {
                getAllHashtagPosts(hashtag, finalOffset, limit)
                .then((data) =>
                {
                    onNewBottomPosts(data, finalFeedPosts, finalOffset);
                })
                .catch((error) =>
                {
                    console.log(error);
                    setIsLoading(false);
                    setLoadingTop(false);
                });
            }
            else if (currentUser)
            {
                if (isInProfile && feedUserId && currentUser.id === feedUserId)
                {
                    getAllUserPosts(currentUser.id, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
                else if (feedUserId && currentUser.id !== feedUserId)
                {
                    getAllUserPosts(feedUserId, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
                else if (!isInProfile && feedUsername && currentUser.username === feedUsername)
                {
                    getFollowedUsersPost(currentUser.id, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
            }
            else
            {
                if (feedUserId)
                {
                    getAllUserPosts(feedUserId, finalOffset, limit)
                    .then((data) =>
                    {
                        onNewBottomPosts(data, finalFeedPosts, finalOffset);
                    })
                    .catch((error) =>
                    {
                        console.log(error);
                        setIsLoading(false);
                        setLoadingTop(false);
                    });
                }
            }
        }
        else
        {
            setIsLoading(false);
            setLoadingTop(false);
            setFeedPosts(posts);
        }

        setRefreshFeed(false);
    }

    const onNewBottomPosts = (data, finalFeedPosts, finalOffset) =>
    {
        let finalToSetFeedPosts = finalFeedPosts;

        setPreviousPosts(previousPosts.concat(finalFeedPosts.slice(0, toRemove)));
        finalToSetFeedPosts = finalToSetFeedPosts.slice(toRemove);
        finalToSetFeedPosts = finalToSetFeedPosts.concat(data);


        if(finalOffset > 0) {
            setAllowScrollToTop(true);
            setNoMoreTopPosts(false);
        }
        else
        {
            setAllowScrollToTop(false);
            setNoMoreTopPosts(true);
        }


        setFeedPosts(finalToSetFeedPosts);

        if (data.length < limit)
        {
            setNoMorePosts(true);
        }

        setOffset(finalOffset + limit)
        setIsLoading(false);
        setLoadingTop(false);
    }

    // useEffect(() => {
    //
    //     if (!('IntersectionObserver' in window)) {
    //         // IntersectionObserver not supported, handle gracefully
    //         return;
    //     }
    //
    //
    //     const options = {
    //         root: null,
    //         rootMargin: '0px',
    //         threshold: 0.1 // Percentage of the target element that should be visible to trigger the callback
    //     };
    //
    //     const observer = new IntersectionObserver((entries) => {
    //         if (entries[0].isIntersecting) {
    //             // User has scrolled to the bottom
    //             if (!noMorePosts && !isLoading) {
    //                 setIsLoading(true);
    //                 refreshFeedPosts(false, false);
    //             }
    //         }
    //     }, options);
    //
    //     if (bottomElementRef.current) {
    //         observer.observe(bottomElementRef.current);
    //     }
    //
    //     return () => {
    //         if (bottomElementRef.current) {
    //             observer.unobserve(bottomElementRef.current);
    //         }
    //     };
    // }, [noMorePosts, isLoading, refreshFeedPosts]);

    useEffect(() => {
        if (inView && !noMorePosts && !isLoading) {
            setIsLoading(true);
            refreshFeedPosts(false, false);
        }
    }, [inView, noMorePosts, isLoading, refreshFeedPosts]);

    const onNewTopPosts = (finalOffset) =>
    {
        let finalToSetFeedPosts = feedPosts;

        if (previousPosts.length === 0)
        {
            setNoMoreTopPosts(true);
            setAllowScrollToTop(false);
            return;
        }

        let toAdd = previousPosts.slice(previousPosts.length - limit);
        let newPreviousPosts = previousPosts.slice(0, previousPosts.length - limit);
        setPreviousPosts(newPreviousPosts);

        if (toAdd.length + feedPosts.length > maxPosts)
        {
            finalToSetFeedPosts = finalToSetFeedPosts.slice(0, finalToSetFeedPosts.length - toRemove);
            finalToSetFeedPosts = toAdd.concat(finalToSetFeedPosts);
            setOffset(prevOffset => prevOffset - toRemove - toRemove);
            setNoMorePosts(false);
        }
        else
        {
            finalToSetFeedPosts = toAdd.concat(finalToSetFeedPosts);
        }

        setFeedPosts(finalToSetFeedPosts);

        if (previousPosts.length === 0)
        {
            setNoMoreTopPosts(true);
            setAllowScrollToTop(false);
        }
    }

    useEffect(() => {
        if (firstRender) {
            refreshFeedPosts(true, false);
            setFirstRender(false);
        }
    });

    useEffect(() => {
        if (refreshFeed) {
            setIsLoading(true);
            refreshFeedPosts(true, false);
        }
    }, [refreshFeed, refreshFeedPosts]);

    return (
        <>
            {(isLoading && loadingTop) ? <Spinner className={'feed-loading'}/> : (
                <div className={'feed-wrapper'}>
                    {loadingTop && <Spinner className={'feed-loading'}/>}

                    <div className={'posts-wrapper'}>
                        {(!loadingTop && allowScrollToTop && !noMoreTopPosts) && (
                            <div className={'load-more-top-buttons-wrapper'}>
                                <button className={'reset-feed-button'} onClick={() => {
                                    setLoadingTop(true);
                                    setIsLoading(true);
                                    refreshFeedPosts(true, false);
                                }}>Refresh feed (top)
                                </button>

                                {/*<button className={'load-previous-posts-button'} onClick={() => {*/}
                                {/*    setLoadingTop(true);*/}
                                {/*    refreshFeedPosts(false, true);*/}
                                {/*}}>Load previous posts</button>*/}
                            </div>
                        )}

                        {(feedPosts.length === 0 && !isLoading) &&
                            <div className={'no-posts'}>No posts to show, follow some people or make a new post</div>}

                        {feedPosts.length > 0 && (
                            feedPosts.map((item) => (
                                <Post key={item.post_id} post={item} postViewer={currentUser} refreshFeed={refreshFeed}
                                      setRefreshFeed={setRefreshFeed} isInFavorites={isInFavorites}/>
                            ))
                        )}

                        {(noMorePosts && feedPosts.length > 0) && <h3 className={'no-more-posts'}>No more posts to show</h3>}
                    </div>

                    {(currentUser && ((!isInProfile && feedUsername && currentUser.username === feedUsername) || (isInProfile && feedUserId && currentUser.id === feedUserId)) && !viewingOnly) && (
                        <button className={`new-post-button ${showNewPostPopup ? 'rotate' : ''}`}
                                onClick={() => setShowNewPostPopup(!showNewPostPopup)}>+</button>)}

                    {isLoading && (<Spinner className={'feed-loading'}/>)}
                    <div ref={bottomElementRef}/>
                    <div ref={ref}/>

                </div>
            )}
        </>
    )
}

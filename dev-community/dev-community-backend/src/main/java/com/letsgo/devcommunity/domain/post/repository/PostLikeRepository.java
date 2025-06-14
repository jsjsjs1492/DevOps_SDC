package com.letsgo.devcommunity.domain.post.repository;

import com.letsgo.devcommunity.domain.post.entity.PostLike;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Transactional
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    Optional<PostLike> findByPostIdAndUserId(Long postId, Long userId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
    List<PostLike> findAllByUserId(Long userId);
    List<PostLike> findAllByPostId(Long postId);
    int countByPostId(Long postId);

    @Query("SELECT COUNT(pl) FROM PostLike pl, Post p WHERE pl.postId = p.id AND p.userId = :memberId")
    long countLikesReceivedByMember(@Param("memberId") Long memberId);
}
